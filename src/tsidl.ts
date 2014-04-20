///<reference path='../typings/node/node.d.ts'/>
///<reference path='../typings/nomnom/nomnom.d.ts'/>
///<reference path='../lib/ts.d.ts'/>

import nomnom = require('nomnom');
import assert = require('assert');

var verbose: boolean = false;

enum ErrorCode {
    MultipleFiles = 1000,
    CouldNotReadFile = 1001,
    CantOpenOutputFile = 1002,
    NotADeclareFile = 1003,
    UnexpectedDeclaration = 1004,
    UnsupportedType = 1005,
    OverloadingNotAllowed = 1006,
    NoFiles = 1007,
    ExternalModulesNotAllowed = 1008,
    PrivateMembersNotAllowed = 1011,
    StaticMembersNotAllowed = 1012,
    NonFunctionAnonymousTypesNotAllowed = 1013,
    IndexersNotAllowed = 1014,
    CallAndConstructNotAllowed = 1015,
    InternalError = 1018,
    GenericsNotAllowed = 1019,
    ExternalTypesNotAllowed = 1020,
    ImportsNotAllowed = 1023,
    ExtendsAndCallNotAllowed = 1024,
    ExtendsAndConstructNotAllowed = 1025,
    MultipleInheritanceNotAllowed = 1026
};

var errorMessage: any =
    {
        /* MultipleFiles */ 1000: "Only one input file may be specified.",
        /* CouldNotReadFile */ 1001: "Could not read file '{0}'.",
        /* CantOpenOutputFile */ 1002: "Could not open output file '{0}'.",
        /* NotADeclareFile */ 1003: "Script is not a declare file.",
        /* UnexpectedDeclaration */ 1004: "Unexpected declaration type {0}.",
        /* UnsupportedType */ 1005: "Unsupported type {0}.",
        /* OverloadingNotAllowed */ 1006: "Overloading not allowed.",
        /* NoFiles */ 1007: "An input file must be specified.",
        /* ExternalModulesNotAllowed */ 1008: "Script cannot be an external module.",
        /* PrivateMembersNotAllowed */ 1011: "Private members are not allowed.",
        /* StaticMembersNotAllowed */ 1012: "Static members are not allowed.",
        /* NonFunctionAnonymousTypesNotAllowed */ 1013: "Anonymous types that are not pure function types are not allowed.",
        /* IndexersNotAllowed */ 1014: "Indexers are not allowed.",
        /* CallAndConstructNotAllowed */ 1015: "Types that declare call signatures and constructor signatures are not allowed.",
        /* InternalError */ 1018: "Internal error.",
        /* GenericsNotAllowed */ 1019: "Generics are not allowed.",
        /* ExternalTypesNotAllowed */ 1020: "Externally declared types are not allowed.",
        /* ImportsNotAllowed */ 1023: "'import' statements are not allowed.",
        /* ExtendsAndCallNotAllowed */ 1024: "'extends' and call signature are not allowed.",
        /* ExtendsAndConstructNotAllowed */ 1025: "'extends' and construct signature are not allowed.",
        /* MultipleInheritanceNotAllowed */ 1026: "Multiple inheritance is not allowed."
    };

function formatString(value: string, substitutions: string[]): string {
    return value.replace(/{(\d+)}/g,
        (match: string, ...args: any[]) => typeof substitutions[args[0]] != 'undefined' ? substitutions[args[0]] : match);
}

function reportGenericError(error: number, ...substitutions: string[]): void {
    console.error("tsidl: error TS" + error.toString() + ": " + formatString(errorMessage[error], substitutions));
}

function reportError(errors: string[], document: TypeScript.Document, position: number, error: number, ...substitutions: string[]): void {
    var origin: string = document.fileName;

    if (position !== -1) {
        var lineAndCharacter = document.lineMap().getLineAndCharacterFromPosition(position);
        origin += "(" + lineAndCharacter.line().toString() + "," + lineAndCharacter.character().toString() + ")";
    }

    var errorString: string = origin + ": error TS" + error.toString() + ": " + formatString(errorMessage[error], substitutions);

    errors.push(errorString);
    logVerbose(errorString);
}

function logVerbose(message: string, substitutions?: string[]): void {
    if (verbose) {
        console.log(formatString(message, substitutions));
    }
}

function compile(source: string, path: string, ioHost: TypeScript.IIO): TypeScript.Document {
    if (source == null) {
        return null;
    }
    var hasErrors: boolean = false;

    function addDiagnostic(diagnostic: TypeScript.Diagnostic) {
        var diagnosticInfo = diagnostic.info();
        if (diagnosticInfo.category === TypeScript.DiagnosticCategory.Error) {
            hasErrors = true;
        }

        if (diagnostic.fileName()) {
            ioHost.stderr.Write(diagnostic.fileName() + "(" + (diagnostic.line() + 1) + "," + (diagnostic.character() + 1) + "): ");
        }

        ioHost.stderr.WriteLine(diagnostic.message());
    }

    var compilerFilePath = ioHost.getExecutingFilePath();
    var containingDirectoryPath = ioHost.dirName(compilerFilePath);
    var libraryFilePath = ioHost.resolvePath(containingDirectoryPath + "/" + "lib.d.ts");
    var library: string = ioHost.readFile(libraryFilePath, null).contents;

    var compiler: TypeScript.TypeScriptCompiler = new TypeScript.TypeScriptCompiler();

    compiler.addFile(libraryFilePath, TypeScript.ScriptSnapshot.fromString(library), TypeScript.ByteOrderMark.None, 0, false);
    compiler.getSyntacticDiagnostics(libraryFilePath).forEach(d => addDiagnostic(d));
    compiler.getSemanticDiagnostics(libraryFilePath).forEach(d => addDiagnostic(d));

    compiler.addFile(path, TypeScript.ScriptSnapshot.fromString(source), TypeScript.ByteOrderMark.None, 0, false);
    compiler.getSyntacticDiagnostics(path).forEach(d => addDiagnostic(d));
    compiler.getSemanticDiagnostics(path).forEach(d => addDiagnostic(d));

    // ReSharper disable once ConditionIsAlwaysConst
    // ReSharper disable once HeuristicallyUnreachableCode
    return hasErrors ? null : compiler.getDocument(path);
}

function clean(path: string): string {
    return path.replace("\"", "").replace("'", "").replace("'", "").replace("\"", "").replace(/\\/g, "/");
}

function getFileNameWithoutExtension(path: string): string {
    var pathComponents: string[] = clean(path).split("/");
    var fullFileName: string = pathComponents[pathComponents.length - 1];
    var fileNameComponents: string[] = fullFileName.split(".");

    if (fileNameComponents[fileNameComponents.length - 1] != "") {
        return fileNameComponents.slice(0, fileNameComponents.length - 1).join(".");
    }
    else {
        return fullFileName;
    }
}

class OutputWriter {
    private headerFile: string;
    private headerComplete: boolean;
    private headerIndent: number;
    private headerAtLineStart: boolean;
    private sourceFile: string;
    private sourceComplete: boolean;
    private sourceIndent: number;
    private sourceAtLineStart: boolean;

    constructor() {
        this.headerFile = "";
        this.headerComplete = false;
        this.headerIndent = 0;
        this.headerAtLineStart = true;
        this.sourceFile = "";
        this.sourceComplete = false;
        this.sourceIndent = 0;
        this.sourceAtLineStart = true;
    }

    public completeHeader(): string {
        this.headerComplete = true;
        return this.headerFile;
    }

    public completeSource(): string {
        this.sourceComplete = true;
        return this.sourceFile;
    }

    private checkHeaderComplete(): void {
        if (this.headerComplete) {
            throw new Error("invalid header write");
        }
    }

    private checkSourceComplete(): void {
        if (this.sourceComplete) {
            throw new Error("invalid source write");
        }
    }

    private checkHeaderIndent(): void {
        if (this.headerAtLineStart) {
            for (var index: number = 0; index < this.headerIndent; index++) {
                this.headerFile += "    ";
            }
        }
        this.headerAtLineStart = false;
    }

    public writeLineHeader(s?: string): void {
        this.checkHeaderComplete();
        this.checkHeaderIndent();
        if (s) {
            this.headerFile += s;
        }
        this.headerFile += "\r\n";
        this.headerAtLineStart = true;
    }

    public writeHeader(s: string): void {
        this.checkHeaderComplete();
        this.checkHeaderIndent();
        this.headerFile += s;
    }

    public indentHeader(): void {
        this.headerIndent += 1;
    }

    public outdentHeader(): void {
        this.headerIndent -= 1;
        if (this.headerIndent < 0) {
            throw new Error("unbalanced indent");
        }
    }

    private checkSourceIndent(): void {
        if (this.sourceAtLineStart) {
            for (var index: number = 0; index < this.sourceIndent; index++) {
                this.sourceFile += "    ";
            }
        }
        this.sourceAtLineStart = false;
    }

    public writeLineSource(s?: string): void {
        this.checkSourceComplete();
        this.checkSourceIndent();
        if (s) {
            this.sourceFile += s;
        }
        this.sourceFile += "\r\n";
        this.sourceAtLineStart = true;
    }

    public writeSource(s: string): void {
        this.checkSourceComplete();
        this.checkSourceIndent();
        this.sourceFile += s;
    }

    public indentSource(): void {
        this.sourceIndent += 1;
    }

    public outdentSource(): void {
        this.sourceIndent -= 1;
        if (this.sourceIndent < 0) {
            throw new Error("unbalanced indent");
        }
    }
}

function javaScriptFunctionType(container: TypeScript.PullTypeSymbol, signature: TypeScript.PullSignatureSymbol, isBound: boolean = false): string {
    var result: string;

    if (isBound) {
        result = "jsrt::bound_function<" + (container ? getFullyQualifiedName(container) : "jsrt::object") + ", ";
    } else {
        result = "jsrt::function<";
    }

    result += typeStringNative(container, signature.returnType.type);

    for (var index: number = 0; index < signature.parameters.length; index++) {
        result += ", ";
        var parameter: TypeScript.PullSymbol = signature.parameters[index];

        result += typeStringNative(container, parameter.type, parameter.isOptional, parameter.isVarArg);
    }
    result += ">";
    return result;
}

function getFullyQualifiedName(symbol: TypeScript.PullSymbol, qualify: boolean = false): string {
    var name: string = "";

    while (symbol) {
        name = symbol.name + (symbol.kind !== TypeScript.PullElementKind.Enum ? "_proxy" : "") + (qualify ? "::" : "") + name;
        qualify = true;
        symbol = symbol.getContainer();
    }

    return name;
}

function typeStringNative(container: TypeScript.PullTypeSymbol, type: TypeScript.PullTypeSymbol, isOptional: boolean = false, isRest: boolean = false, isBound: boolean = false): string {
    var typeString: string = "<unknown>";

    if (type.isPrimitive()) {
        if (type.name === "boolean") {
            typeString = "bool";
        }
        else if (type.name === "number") {
            typeString = "double";
        }
        else if (type.name === "string") {
            typeString = "std::wstring";
        }
        else if (type.name === "void") {
            typeString = "void";
        }
        else if (type.name === "any") {
            typeString = "jsrt::object";
        }
    }
    else if (type.isArrayNamedTypeReference()) {
        if (isRest) {
            typeString = typeStringNative(container, type.getElementType());
        } else {
            typeString = "jsrt::array<" + typeStringNative(container, type.getElementType()) + ">";
        }
    }
    else if (type.kind == TypeScript.PullElementKind.ObjectType ||
        type.kind == TypeScript.PullElementKind.FunctionType ||
        type.kind == TypeScript.PullElementKind.ConstructorType) {
        if (type.hasOwnCallSignatures()) {
            typeString = javaScriptFunctionType(container, type.getCallSignatures()[0], isBound);
        } else if (type.hasOwnConstructSignatures()) {
            typeString = javaScriptFunctionType(container, type.getConstructSignatures()[0], isBound);
        } else {
            typeString = "jsrt::object";
        }
    }
    else if (type.isNamedTypeSymbol()) {
        typeString = getFullyQualifiedName(type);
    }

    if (isRest) {
        typeString = "std::vector<" + typeString + ">";
    } else if (isOptional) {
        typeString = "jsrt::optional<" + typeString + ">";
    }

    return typeString;
}

function writeField(container: TypeScript.PullTypeSymbol, name: string, type: TypeScript.PullTypeSymbol, outputWriter: OutputWriter, readOnly: boolean = false): void {
    var global: string = container ? "" : "jsrt::context::global().";
    var fieldType: string = typeStringNative(container, type);
    var boundFieldType: string = typeStringNative(container, type, false, false, true);
    var classQualifier: string = getFullyQualifiedName(container, true);

    outputWriter.writeLineHeader(boundFieldType + " " + name + "();");
    if (!readOnly) {
        outputWriter.writeLineHeader("void set_" + name + "(" + fieldType + " value);");
    }

    outputWriter.writeLineSource(boundFieldType + " " + classQualifier + name + "()");
    outputWriter.writeLineSource("{");
    outputWriter.indentSource();
    if (fieldType !== boundFieldType) {
        outputWriter.writeLineSource("return " + boundFieldType + "(" + (global ? "jsrt::context::global()" : "*this") + ", " + global + "get_property<" + fieldType + ">(jsrt::property_id::create(L\"" + name + "\")));");
    } else {
        outputWriter.writeLineSource("return " + global + "get_property<" + fieldType + ">(jsrt::property_id::create(L\"" + name + "\"));");
    }
    outputWriter.outdentSource();
    outputWriter.writeLineSource("}");

    if (!readOnly) {
        outputWriter.writeLineSource("void " + classQualifier + "set_" + name + "(" + fieldType + " value)");
        outputWriter.writeLineSource("{");
        outputWriter.indentSource();
        outputWriter.writeLineSource(global + "set_property(jsrt::property_id::create(L\"" + name + "\"), value);");
        outputWriter.outdentSource();
        outputWriter.writeLineSource("}");
    }
}

function writeTypeImplements(typeName: string, baseName: string, implementsList: TypeScript.PullTypeSymbol[], outputWriter: OutputWriter): void {
    for (var index = 0; index < implementsList.length; index++) {
        var implementedType: TypeScript.PullTypeSymbol = implementsList[index];
        var implementedTypeName: string = implementedType.name + "_proxy";

        outputWriter.writeLineHeader("explicit " + typeName + "(" + implementedTypeName + " value);");
        outputWriter.writeLineHeader("operator " + implementedTypeName + "();");

        outputWriter.writeLineSource(typeName + "::" + typeName + "(" + implementedTypeName + " value) :");
        outputWriter.indentSource();
        outputWriter.writeLineSource("" + baseName + "(value)");
        outputWriter.outdentSource();
        outputWriter.writeLineSource("{");
        outputWriter.writeLineSource("}");
        outputWriter.writeLineSource(typeName + "::" + "operator " + implementedTypeName + "()");
        outputWriter.writeLineSource("{");
        outputWriter.indentSource();
        outputWriter.writeLineSource("return " + implementedTypeName + "(*this);");
        outputWriter.outdentSource();
        outputWriter.writeLineSource("}");
    }
}

function writeType(container: TypeScript.PullTypeSymbol, type: TypeScript.PullTypeSymbol, outputWriter: OutputWriter): void {
    var baseName: string;
    var emitSignatureConstructor: boolean = false;
    var typeName: string = type.name + "_proxy";
    var fullyQualifiedName: string = getFullyQualifiedName(type);

    if (type.hasOwnCallSignatures()) {
        baseName = javaScriptFunctionType(type, type.getCallSignatures()[0]);
        emitSignatureConstructor = true;
    } else if (type.hasOwnConstructSignatures()) {
        baseName = javaScriptFunctionType(type, type.getConstructSignatures()[0]);
        emitSignatureConstructor = true;
    } else if (type.getExtendedTypes().length > 0) {
        baseName = type.getExtendedTypes()[0].name + "_proxy";
    } else {
        baseName = "jsrt::object";
    }

    writeClass(fullyQualifiedName, typeName, baseName, outputWriter);

    if (emitSignatureConstructor) {
        outputWriter.writeLineHeader(typeName + "(Signature signature);");

        outputWriter.writeLineSource(fullyQualifiedName + "::" + typeName + "(Signature signature) :");
        outputWriter.indentSource();
        outputWriter.writeLineSource("" + baseName + "(signature)");
        outputWriter.outdentSource();
        outputWriter.writeLineSource("{");
        outputWriter.writeLineSource("}");
    }

    var implementedTypes: TypeScript.PullTypeSymbol[] = type.getImplementedTypes();
    if (implementedTypes && implementedTypes.length > 0) {
        writeTypeImplements(typeName, baseName, implementedTypes, outputWriter);
    }

    var members: TypeScript.PullSymbol[] = type.getMembers();

    if (members && members.length > 0) {
        members.forEach((symbol: TypeScript.PullSymbol) => {
            writeMember(type, symbol, outputWriter);
        });
    }

    outputWriter.outdentHeader();
    outputWriter.writeLineHeader("};");
}

function writeEnumMember(member: TypeScript.PullEnumElementDecl, outputWriter: OutputWriter): void {
    outputWriter.writeHeader(member.name);
    if (member.constantValue) {
        outputWriter.writeHeader(" = " + member.constantValue.toString());
    }
    outputWriter.writeLineHeader(",");
}

function writeMember(container: TypeScript.PullTypeSymbol, member: TypeScript.PullSymbol, outputWriter: OutputWriter): void {
    var skip: boolean = member.name === "" || (member.type.getAssociatedContainerType() !== null);

    if (skip) {
        return;
    }

    switch (member.kind) {
        case TypeScript.PullElementKind.Function:
        case TypeScript.PullElementKind.Variable:
        case TypeScript.PullElementKind.Property:
        case TypeScript.PullElementKind.Method:
            writeField(container, member.name, member.type, outputWriter);
            break;

        case TypeScript.PullElementKind.Interface:
            writeType(container, member.type, outputWriter);
            break;

        case TypeScript.PullElementKind.Enum:
            writeContainer(container, member.getDeclarations()[0], outputWriter);
            break;

        case TypeScript.PullElementKind.Class:
            writeType(container, member.type, outputWriter);
            writeField(container, member.name, member.type.getConstructorMethod().type, outputWriter, true);
            break;

        case TypeScript.PullElementKind.Container:
            writeContainer(container, member.getDeclarations()[0], outputWriter);
            writeField(container, member.name, member.type, outputWriter, true);
            break;

        case TypeScript.PullElementKind.EnumMember:
            writeEnumMember(<TypeScript.PullEnumElementDecl>(member.getDeclarations()[0]), outputWriter);
            break;

        default:
            assert(false, "unexpected kind " + TypeScript.PullElementKind[member.kind]);
            break;
    }
}

function writeClass(fullyQualifiedName: string, typeName: string, baseName: string, outputWriter: OutputWriter): void {
    outputWriter.writeLineHeader("class " + typeName + ": public " + baseName);
    outputWriter.writeLineHeader("{");
    outputWriter.writeLineHeader("public:");
    outputWriter.indentHeader();
    outputWriter.writeLineHeader(typeName + "();");
    outputWriter.writeLineHeader("explicit " + typeName + "(jsrt::object object);");
    if (baseName !== "jsrt::object") {
        outputWriter.writeLineHeader("explicit " + typeName + "(" + baseName + " object);");
    }

    outputWriter.writeLineSource(fullyQualifiedName + "::" + typeName + "() :");
    outputWriter.indentSource();
    outputWriter.writeLineSource("" + baseName + "()");
    outputWriter.outdentSource();
    outputWriter.writeLineSource("{");
    outputWriter.writeLineSource("}");

    outputWriter.writeLineSource(fullyQualifiedName + "::" + typeName + "(jsrt::object object) :");
    outputWriter.indentSource();
    outputWriter.writeLineSource(baseName + "(object)");
    outputWriter.outdentSource();
    outputWriter.writeLineSource("{");
    outputWriter.writeLineSource("}");

    if (baseName !== "jsrt::object") {
        outputWriter.writeLineSource(fullyQualifiedName + "::" + typeName + "(" + baseName + " object) :");
        outputWriter.indentSource();
        outputWriter.writeLineSource(baseName + "(object)");
        outputWriter.outdentSource();
        outputWriter.writeLineSource("{");
        outputWriter.writeLineSource("}");
    }
}

function writeContainer(outerContainer: TypeScript.PullTypeSymbol, container: TypeScript.PullDecl, outputWriter: OutputWriter): void {
    var containerSymbol: TypeScript.PullSymbol = container.getSymbol();
    var typeName: string = container.name + "_proxy";
    var fullyQualifiedName: string = getFullyQualifiedName(containerSymbol);

    if (containerSymbol) {
        if (container.kind === TypeScript.PullElementKind.Container) {
            writeClass(fullyQualifiedName, typeName, "jsrt::object", outputWriter);
        } else {
            outputWriter.writeLineHeader("enum " + container.name);
            outputWriter.writeLineHeader("{");
            outputWriter.indentHeader();
        }
    }

    var childDecls: TypeScript.PullDecl[] = container.getChildDecls();

    if (childDecls) {
        var seen: any = {};

        childDecls.forEach(childDecl => {
            var s: TypeScript.PullSymbol = childDecl.getSymbol();
            if (s && !seen[s]) {
                writeMember(containerSymbol ? containerSymbol.type : null, s, outputWriter);
                seen[s] = true;
            }
        });
    }

    if (containerSymbol) {
        outputWriter.outdentHeader();
        outputWriter.writeLineHeader("};");
    }
}

function writeDocument(document: TypeScript.Document, outputWriter: OutputWriter): void {
    writeContainer(null, document.topLevelDecl(), outputWriter);
}

function cleanName(name: string): string {
    return name.replace(/-/g, "_");
}

function writePrologue(baseName: string, outputWriter: OutputWriter): void {
    var namespaceName: string = cleanName(baseName);

    outputWriter.writeLineHeader("// This file contains automatically generated proxies for JavaScript.");
    outputWriter.writeLineHeader();
    outputWriter.writeLineHeader("#include <jsrt.h>");
    outputWriter.writeLineHeader("#include \"jsrt.wrappers.h\"");
    outputWriter.writeLineHeader();
    outputWriter.writeLineHeader("namespace " + namespaceName);
    outputWriter.writeLineHeader("{");
    outputWriter.indentHeader();

    outputWriter.writeLineSource("// This file contains automatically generated proxies for JavaScript.");
    outputWriter.writeLineSource();
    outputWriter.writeLineSource("#include \"" + baseName + ".proxy.h\"");
    outputWriter.writeLineSource();
    outputWriter.writeLineSource("namespace " + namespaceName);
    outputWriter.writeLineSource("{");
    outputWriter.indentSource();
}

function writeEpilogue(baseName: string, outputWriter: OutputWriter): void {
    var namespaceName: string = cleanName(baseName);

    outputWriter.outdentHeader();
    outputWriter.writeLineHeader("} // namespace " + namespaceName);

    outputWriter.outdentSource();
    outputWriter.writeLineSource("} // namespace " + namespaceName);
}

function checkTypeReference(document: TypeScript.Document, decl: TypeScript.PullDecl, type: TypeScript.PullTypeSymbol, errors: string[]): void {
    if (verbose && type) {
        console.log(formatString("Checking type reference, kind '{0}'.", [TypeScript.PullElementKind[type.kind]]));
    }

    if (!type) {
        // Fall through
    }
    else if (type.isPrimitive()) {
        if (type.name === "boolean" || type.name === "number" || type.name === "string" || type.name === "void" || type.name === "any") {
            return;
        }
    }
    else if (type.isArrayNamedTypeReference()) {
        checkTypeReference(document, decl, type.getElementType(), errors);
        return;
    }
    else if (type.isNamedTypeSymbol()) {
        var declarations: TypeScript.PullDecl[] = type.getDeclarations();
        var sourceUnit: TypeScript.SourceUnit = document.sourceUnit();

        assert(declarations && declarations.length > 0);

        if (declarations.every((value: TypeScript.PullDecl): boolean => {
            var ast: TypeScript.AST = document._getASTForDecl(value);
            while (ast) {
                if (ast === sourceUnit) {
                    return true;
                }

                ast = ast.parent;
            }

            return false;
        })) {
            return;
        } else {
            reportError(errors, document, decl.getSpan().start(), ErrorCode.ExternalTypesNotAllowed);
            return;
        }
    }
    else if (type.kind == TypeScript.PullElementKind.ObjectType ||
        type.kind == TypeScript.PullElementKind.FunctionType ||
        type.kind == TypeScript.PullElementKind.ConstructorType) {
        assert(type.name === "");
        checkType(document, decl, type, errors);
        return;
    }

    reportError(errors, document, decl.getSpan().start(), ErrorCode.UnsupportedType, TypeScript.PullElementKind[type.kind]);
}

function checkMembers(document: TypeScript.Document, decl: TypeScript.PullDecl, type: TypeScript.PullTypeSymbol, errors: string[]): void {
    var members: TypeScript.PullSymbol[] = type.getMembers();

    if (members && members.length > 0) {
        members.forEach((symbol: TypeScript.PullSymbol) => {
            var skip: boolean = symbol.name === "" || (symbol.type.getAssociatedContainerType() !== null);

            logVerbose("{0} member '{1}', kind '{2}'.", [skip ? "Skipping" : "Checking", symbol.name, TypeScript.PullElementKind[symbol.kind]]);

            if (skip) {
                return;
            }

            if (!symbol.isExternallyVisible()) {
                reportError(errors, document, decl.getSpan().start(), ErrorCode.PrivateMembersNotAllowed);
            }

            var memberDecls: TypeScript.PullDecl[] = symbol.getDeclarations();

            assert(memberDecls && memberDecls.length === 1);
            checkType(document, memberDecls[0], symbol.type, errors);
        });
    }
}

function checkCallSignatures(document: TypeScript.Document, decl: TypeScript.PullDecl, type: TypeScript.PullTypeSymbol, errors: string[]): void {
    var callSignatures: TypeScript.PullSignatureSymbol[] = type.getCallSignatures();

    if (!callSignatures || callSignatures.length === 0) {
        return;
    }

    if (callSignatures.length > 1) {
        reportError(errors, document, decl.getSpan().start(), ErrorCode.OverloadingNotAllowed);
        return;
    }

    if (type.getConstructSignatures() && type.getConstructSignatures().length > 0) {
        reportError(errors, document, decl.getSpan().start(), ErrorCode.CallAndConstructNotAllowed);
    }

    if (type.hasOwnCallSignatures() && type.getExtendedTypes().length > 0) {
        reportError(errors, document, decl.getSpan().start(), ErrorCode.ExtendsAndCallNotAllowed);
    }

    var callSignature: TypeScript.PullSignatureSymbol = callSignatures[0];

    if (callSignature.isGeneric()) {
        reportError(errors, document, decl.getSpan().start(), ErrorCode.GenericsNotAllowed);
        return;
    }

    callSignature.parameters.forEach(param => {
        logVerbose("Checking parameter '{0}'.", [param.name]);
        checkTypeReference(document, decl, param.type, errors);
    });

    logVerbose("Checking return type.");

    checkTypeReference(document, decl, callSignature.returnType, errors);
}

function checkConstructSignatures(document: TypeScript.Document, decl: TypeScript.PullDecl, type: TypeScript.PullTypeSymbol, errors: string[]): void {
    var constructSignatures: TypeScript.PullSignatureSymbol[] = type.getConstructSignatures();

    if (!constructSignatures || constructSignatures.length === 0) {
        return;
    }

    if (constructSignatures.length > 1) {
        reportError(errors, document, decl.getSpan().start(), ErrorCode.OverloadingNotAllowed);
        return;
    }

    if (type.hasOwnConstructSignatures() && type.getExtendedTypes().length > 0) {
        reportError(errors, document, decl.getSpan().start(), ErrorCode.ExtendsAndConstructNotAllowed);
    }

    var constructSignature: TypeScript.PullSignatureSymbol = constructSignatures[0];

    if (constructSignature.isGeneric()) {
        reportError(errors, document, decl.getSpan().start(), ErrorCode.GenericsNotAllowed);
        return;
    }

    constructSignature.parameters.forEach(param => {
        logVerbose("Checking parameter '{0}'.", [param.name]);
        checkTypeReference(document, decl, param.type, errors);
    });
}

function checkType(document: TypeScript.Document, decl: TypeScript.PullDecl, type: TypeScript.PullTypeSymbol, errors: string[]): void {
    logVerbose("Checking type '{0}', kind '{1}'.", [type.name, TypeScript.PullElementKind[type.kind]]);

    if (type.isGeneric()) {
        reportError(errors, document, decl.getSpan().start(), ErrorCode.GenericsNotAllowed);
        return;
    }

    if (type.getIndexSignatures() && type.getIndexSignatures().length > 0) {
        reportError(errors, document, decl.getSpan().start(), ErrorCode.IndexersNotAllowed);
    }

    checkCallSignatures(document, decl, type, errors);
    checkConstructSignatures(document, decl, type, errors);

    if (!type.getAssociatedContainerType() && type.name === "" && type.getMembers() && type.getMembers().length > 0) {
        reportError(errors, document, decl.getSpan().start(), ErrorCode.NonFunctionAnonymousTypesNotAllowed);
    }

    var constructorMethod: TypeScript.PullSymbol = type.getConstructorMethod();

    if (constructorMethod) {
        var prototype: TypeScript.PullTypeSymbol = constructorMethod.type;
        var prototypeMembers: TypeScript.PullSymbol[] = prototype.getMembers();

        if (prototypeMembers && prototypeMembers.length > 0) {
            prototypeMembers.forEach(m => {
                if (m.name !== "prototype") {
                    reportError(errors, document, decl.getSpan().start(), ErrorCode.StaticMembersNotAllowed);
                }
            });
        }
    }

    var implementedTypes: TypeScript.PullTypeSymbol[] = type.getImplementedTypes();
    var index: number;

    if (implementedTypes && implementedTypes.length > 0) {
        for (index = 0; index < implementedTypes.length; index++) {
            checkTypeReference(document, decl, implementedTypes[index], errors);
        }
    }

    var extendedTypes: TypeScript.PullTypeSymbol[] = type.getExtendedTypes();

    if (extendedTypes && extendedTypes.length > 0) {
        if (extendedTypes.length !== 1) {
            reportError(errors, document, decl.getSpan().start(), ErrorCode.MultipleInheritanceNotAllowed);
        }
        checkTypeReference(document, decl, extendedTypes[0], errors);
    }

    checkMembers(document, decl, type, errors);
}

function checkContainerMember(document: TypeScript.Document, member: TypeScript.PullSymbol, errors: string[]): void {
    var skip: boolean = member.name === "" || (member.type.getAssociatedContainerType() !== null);

    logVerbose("{0} container member '{1}', kind '{2}'.", [skip ? "Skipping" : "Checking", member.name, TypeScript.PullElementKind[member.kind]]);

    if (skip) {
        return;
    }

    switch (member.kind) {
        case TypeScript.PullElementKind.Variable:
            assert(member.getDeclarations().length > 0);
            checkTypeReference(document, member.getDeclarations()[0], member.type, errors);
            break;

        case TypeScript.PullElementKind.Class:
        case TypeScript.PullElementKind.Interface:
        case TypeScript.PullElementKind.Function:
            assert(member.getDeclarations().length > 0);
            checkType(document, member.getDeclarations()[0], member.type, errors);
            break;

        case TypeScript.PullElementKind.Enum:
        case TypeScript.PullElementKind.Container:
            assert(member.getDeclarations().length === 1);
            checkContainer(document, member.getDeclarations()[0], errors);
            break;

        case TypeScript.PullElementKind.EnumMember:
            break;

        case TypeScript.PullElementKind.TypeAlias:
            assert(member.getDeclarations().length > 0);
            reportError(errors, document, member.getDeclarations()[0].getSpan().start(), ErrorCode.ImportsNotAllowed);
            break;

        case TypeScript.PullElementKind.DynamicModule:
            reportError(errors, document, -1, ErrorCode.ExternalModulesNotAllowed);
            break;

        default:
            assert(member.getDeclarations().length > 0);
            reportError(errors, document, member.getDeclarations()[0].getSpan().start(), ErrorCode.UnexpectedDeclaration, TypeScript.PullElementKind[member.kind]);
            break;
    }
}

function checkContainer(document: TypeScript.Document, decl: TypeScript.PullDecl, errors: string[]): void {
    logVerbose("Checking container '{0}', kind '{1}'.", [decl.name, TypeScript.PullElementKind[decl.kind]]);

    var childDecls: TypeScript.PullDecl[] = decl.getChildDecls();

    if (childDecls) {
        var seen: any = {};

        childDecls.forEach(childDecl => {
            var s: TypeScript.PullSymbol = childDecl.getSymbol();
            if (!s) {
                logVerbose("Skipping container member decl kind '{0}'.", [TypeScript.PullElementKind[decl.kind]]);
            }
            else if (!seen[s]) {
                checkContainerMember(document, s, errors);
                seen[s] = true;
            }
        });
    }
}

function checkDocument(document: TypeScript.Document, errors: string[]): void {
    if (!document.isDeclareFile()) {
        reportError(errors, document, -1, ErrorCode.NotADeclareFile);
        return;
    }

    if (document.isExternalModule()) {
        reportError(errors, document, -1, ErrorCode.ExternalModulesNotAllowed);
        return;
    }

    checkContainer(document, document.topLevelDecl(), errors);
}

function printLogo(): void {
    console.log("TsIdl Version 1.0");
    console.log("Copyright (C) Paul Vick. All rights reserved.");
    console.log();
}

function main(): void {
    var ioHost: TypeScript.IIO = TypeScript.IO;

    nomnom
        .script("tsidl")
        .option("nologo",
        {
            flag: true,
            help: "Suppress logo display",
        })
        .option("header",
        {
            abbrev: "h",
            help: "The target header to write to."
        })
        .option("source",
        {
            abbrev: "s",
            help: "The target source to write to."
        })
        .option("verbose",
        {
            flag: true,
            abbrev: "v",
            help: "Output verbose information"
        });

    // CONSIDER: Option to choose line endings? Choose endings based on platform?

    var cmdLine = nomnom.parse(ioHost.arguments);
    var files = <string[]>cmdLine._;

    if (!cmdLine.nologo) {
        printLogo();
    }

    verbose = cmdLine.verbose;

    if (!files || files.length == 0) {
        reportGenericError(ErrorCode.NoFiles);
        process.exit(1);
    }

    if (files.length > 1) {
        reportGenericError(ErrorCode.MultipleFiles);
        process.exit(1);
    }

    var script: string = "";

    try {
        var scriptFile: TypeScript.FileInformation = ioHost.readFile(files[0], null);
        script = scriptFile.contents;
    }
    catch (err) {
        reportGenericError(ErrorCode.CouldNotReadFile, files[0]);
    }

    var document: TypeScript.Document = compile(script, files[0], ioHost);

    if (!document) {
        process.exit(1);
    }

    var errors: string[] = [];

    checkDocument(document, errors);

    if (errors.length > 0) {
        errors.forEach(s => {
            console.error(s);
        });
        process.exit(1);
    }

    var outputWriter: OutputWriter = new OutputWriter();
    var baseName: string = getFileNameWithoutExtension(files[0]);

    if ((/\.d$/i).test(baseName)) {
        baseName = baseName.substring(0, baseName.length - 2);
    }

    var headerFileName: string = cmdLine.header || baseName + ".proxy.h";
    var sourceFileName: string = cmdLine.source || baseName + ".proxy.cpp";

    writePrologue(baseName, outputWriter);
    writeDocument(document, outputWriter);
    writeEpilogue(baseName, outputWriter);

    try {
        ioHost.writeFile(headerFileName, outputWriter.completeHeader(), false);
        ioHost.writeFile(sourceFileName, outputWriter.completeSource(), false);
    }
    catch (err) {
        reportGenericError(ErrorCode.CantOpenOutputFile, headerFileName);
        process.exit(1);
    }
}

main();