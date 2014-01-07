///<reference path='../external/typescript/src/compiler/typescript.ts'/>
///<reference path='../external/typescript/src/compiler/io.ts'/>
///<reference path='options.ts'/>

enum ErrorCode
{
    MultipleFiles = 1000,
    CouldNotReadFile = 1001,
    CantOpenOutputFile = 1002,
    NotADeclareFile = 1003,
    UnexpectedDeclaration = 1004,
    UnsupportedType = 1005,
    OverloadingNotAllowed = 1006,
    NoFiles = 1007,
    ExternalModulesNotAllowed = 1008,
    ClassExtensionNotAllowed = 1009,
    // UNUSED 1010,
    PrivateMembersNotAllowed = 1011,
    StaticMembersNotAllowed = 1012,
    NonFunctionAnonymousTypesNotAllowed = 1013,
    IndexersNotAllowed = 1014,
    CallAndConstructNotAllowed = 1015,
    //CallInNonAnonymousTypeNotAllowed = 1016,
    ConstructInNonAnonymousTypeNonClassNotAllowed = 1017,
};

var ErrorMessages: any =
{
    /* MultipleFiles */ 1000: "Only one input file may be specified.",
    /* CouldNotReadFile */ 1001: "Could not read file '{0}'.",
    /* CantOpenOutputFile */ 1002: "Could not open output file '{0}'.",
    /* NotADeclareFile */ 1003: "Script is not a declare file.",
    /* UnexpectedDeclaration */ 1004: "Unexpected declaration type {0}.",
    /* UnsupportedType */ 1005: "Unsupported type.",
    /* OverloadingNotAllowed */ 1006: "Overloading not allowed.",
    /* NoFiles */ 1007: "An input file must be specified.",
    /* ExternalModulesNotAllowed */ 1008: "Script cannot be an external module.",
    /* ClassExtensionNotAllowed */ 1009: "Class inheritance is not allowed.",
    /* PrivateMembersNotAllowed */ 1011: "Private members are not allowed.",
    /* StaticMembersNotAllowed */ 1012: "Static members are not allowed.",
    /* NonFunctionAnonymousTypesNotAllowed */ 1013: "Anonymous types that are not pure function types are not allowed.",
    /* IndexersNotAllowed */ 1014: "Indexers are not allowed.",
    /* CallAndConstructNotAllowed */ 1015: "Types that declare call signatures and constructor signatures are not allowed.",
    ///* CallInNonAnonymousTypeNotAllowed */ 1016: "Non-anonymous types cannot declare a call signature.",
    /* ConstructInNonAnonymousTypeNonClassNotAllowed */ 1017: "Constructors can only be declared in classes and anonymous types.",
};

function formatString(value: string, substitutions: string[]): string
{
    return value.replace(/{(\d+)}/g, 
        (match: string, ...args: any[])=> typeof substitutions[args[0]] != 'undefined' ? substitutions[args[0]] : match);
}

function reportError(origin: string, error: number, ... substitutions: string[]): void
{
    console.error(origin + ": error TS" + error.toString() + ": " + formatString(ErrorMessages[error], substitutions));
}

function compile(source: string, path: string, ioHost: TypeScript.IIO): TypeScript.Document
{
    if (source != null)
    {
        var hasErrors: boolean = false;

        function addDiagnostic(diagnostic: TypeScript.Diagnostic)
        {
            var diagnosticInfo = diagnostic.info();
            if (diagnosticInfo.category === TypeScript.DiagnosticCategory.Error)
            {
                hasErrors = true;
            }

            if (diagnostic.fileName())
            {
                ioHost.stderr.Write(diagnostic.fileName() + "(" + (diagnostic.line() + 1) + "," + (diagnostic.character() + 1) + "): ");
            }

            ioHost.stderr.WriteLine(diagnostic.message());
        }

        var compiler: TypeScript.TypeScriptCompiler = new TypeScript.TypeScriptCompiler();
        compiler.addFile(path, TypeScript.ScriptSnapshot.fromString(source), TypeScript.ByteOrderMark.None, 0, false);
        compiler.getSyntacticDiagnostics(path).forEach(d => addDiagnostic(d));
        compiler.getSemanticDiagnostics(path).forEach(d => addDiagnostic(d));

// ReSharper disable once ConditionIsAlwaysConst
// ReSharper disable once HeuristicallyUnreachableCode
        return hasErrors ? null : compiler.getDocument(path);
    }

    return null;
}

function clean(path: string): string
{
    return path.replace("\"", "").replace("'", "").replace("'", "").replace("\"", "").replace(/\\/g, "/");
}

function getFileNameWithoutExtension(path: string): string
{
    var pathComponents: string[] = clean(path).split("/");
    var fullFileName: string = pathComponents[pathComponents.length - 1];
    var fileNameComponents: string[] = fullFileName.split(".");

    if (fileNameComponents[fileNameComponents.length - 1] != "")
    {
        return fileNameComponents.slice(0, fileNameComponents.length - 1).join(".");
    }
    else
    {
        return fullFileName;
    }
}

function getFileName(path: string): string
{
    var pathComponents: string[] = clean(path).split("/");
    return pathComponents[pathComponents.length - 1];
}

//function isAnonymous(type: TypeScript.Type): boolean
//{
//    return (type.symbol.name && (type.symbol.name == "_anonymous" || type.symbol.name == "_construct")) ||
//           (type.symbol.declAST && type.symbol.declAST.nodeType == TypeScript.NodeType.FuncDecl);
//}

//function javaScriptFunctionType(container: TypeScript.Type, signature: TypeScript.Signature): string
//{
//    var result: string = "jsrt::function<" + typeStringNative(container, signature.returnType.type);
//    for (var index: number = 0; index < signature.parameters.length; index++)
//    {
//        result += ", ";
//        var parameter: TypeScript.ParameterSymbol = signature.parameters[index];
//        var isRest: boolean = signature.hasVariableArgList && (index == signature.parameters.length - 1);

//        result += typeStringNative(container, parameter.getType(), parameter.isOptional(), isRest);
//    }
//    result += ">";
//    return result;
//}

//function typeStringNative(container: TypeScript.Type, type: TypeScript.Type, isOptional: boolean = false, isRest: boolean = false): string
//{
//    var typeString: string;

//    if (type.primitiveTypeClass == TypeScript.Primitive.Boolean)
//    {
//        typeString = "bool";
//    }
//    else if (type.primitiveTypeClass == TypeScript.Primitive.Double)
//    {
//        typeString = "double";
//    }
//    else if (type.primitiveTypeClass == TypeScript.Primitive.String)
//    {
//        typeString = "std::wstring";
//    }
//    else if (type.primitiveTypeClass == TypeScript.Primitive.Void)
//    {
//        typeString = "void";
//    }
//    else if (type.primitiveTypeClass == TypeScript.Primitive.Any)
//    {
//        typeString = "jsrt::object";
//    }
//    else if (type.isArray())
//    {
//        typeString = "jsrt::array<" + typeStringNative(container, type.elementType) + ">";
//    }
//    else if (isAnonymous(type) || type.isClass())
//    {
//        if (type.call)
//        {
//            typeString = javaScriptFunctionType(container, type.call.signatures[0]);
//        }
//        else
//        {
//            typeString = javaScriptFunctionType(container, type.construct.signatures[0]);
//        }
//    }
//    else
//    {
//        var name: string = type.getTypeName() + "_proxy";
//        var symbol: TypeScript.Symbol = type.symbol;
    
//        while ((container && symbol.container != container.symbol && symbol.container.name != TypeScript.globalId) ||
//            (!container && symbol.container.name != TypeScript.globalId))
//        {
//            symbol = symbol.container;
//            name = symbol.name + "_proxy::" + name;
//        }

//        typeString = name;
//    }

//    if (isOptional)
//    {
//        typeString = "jsrt::optional<" + typeString + ">";
//    }
//    else if (isRest)
//    {
//        typeString = "jsrt::rest<" + typeString + ">";
//    }

//    return typeString;
//}

//function writeFieldDeclaration(container: TypeScript.Type, name: string, type: TypeScript.Type, headerFile: IO.FileWriter): void
//{
//    var fieldTypeName: string = typeStringNative(container, type);

//    headerFile.write("\n\
//\n\
//    " + fieldTypeName + " __stdcall " + name + "()\n\
//    {\n\
//        return get_property<" + fieldTypeName + ">(jsrt::property_id::create(L\"" + name + "\"));\n\
//    }\n\
//\n\
//    void __stdcall set_" + name + "(" + fieldTypeName + " value)\n\
//    {\n\
//        set_property(jsrt::property_id::create(L\"" + name + "\"), value);\n\
//    }\n\
//\n\
//    jsrt::property_descriptor<" + fieldTypeName + "> __stdcall " + name + "_descriptor()\n\
//    {\n\
//        return get_own_property_descriptor<" + fieldTypeName + ">(jsrt::property_id::create(L\"" + name + "\"));\n\
//    }\n\
//\n\
//    bool __stdcall set_" + name + "_descriptor(jsrt::property_descriptor<" + fieldTypeName + "> descriptor)\n\
//    {\n\
//        return define_property(jsrt::property_id::create(L\"" + name + "\"), descriptor);\n\
//    }");
//}

//function writeTypeMemberDeclarations(container: TypeScript.Type, members: TypeScript.ScopedMembers, filter: (symbol: TypeScript.Symbol) => boolean, headerFile: IO.FileWriter): void
//{
//    var allMembers: TypeScript.IHashTable = members.allMembers;
//    var memberNames: string[] = allMembers.getAllKeys();
//    for (var index = 0; index < memberNames.length; index++)
//    {
//        var memberName: string = memberNames[index];
//        if (!filter || filter(<TypeScript.Symbol>allMembers.lookup(memberName)))
//        {
//            writeFieldDeclaration(container, memberName, (<TypeScript.Symbol>allMembers.lookup(memberName)).getType(), headerFile);
//        }
//    }
//}

//function writeNestedTypeDeclarations(members: TypeScript.ScopedMembers, headerFile: IO.FileWriter): void
//{
//    var allMembers: TypeScript.IHashTable = members.allMembers;
//    var memberNames: string[] = allMembers.getAllKeys();

//    if (memberNames.length > 0)
//    {
//        headerFile.writeLine();
//    }

//    for (var index = 0; index < memberNames.length; index++)
//    {
//        var memberName: string = memberNames[index];
//        var type: TypeScript.Type = (<TypeScript.Symbol>allMembers.lookup(memberName)).getType();
//        if (type.isClass())
//        {
//            type = type.instanceType;
//        }
//        writeTypeDeclaration(type, headerFile);
//    }
//}

//function writePrototypeDeclaration(type: TypeScript.Type, headerFile: IO.FileWriter): void
//{
//    var symbol: TypeScript.Symbol = type.symbol;

//    headerFile.write("\n\
//class prototype_proxy: public jsrt::object\n\
//{\n\
//public:\n\
//    prototype_proxy() :\n\
//        jsrt::object()\n\
//    {\n\
//    }\n\
//\n\
//    explicit prototype_proxy(jsrt::object object) :\n\
//        jsrt::object(object.handle())\n\
//    {\n\
//    }");

//    function isMember(symbol: TypeScript.Symbol): boolean
//    {
//        return symbol.kind() == TypeScript.SymbolKind.Type && (<TypeScript.TypeSymbol>symbol).isMethod;
//    }

//    writeTypeMemberDeclarations(type, type.members, isMember, headerFile);
//    writeTypeMemberDeclarations(type, type.ambientMembers, isMember, headerFile);
    
//    headerFile.write("\n};");
//}

//function writeTypeImplements(type: TypeScript.Type, implementsList: TypeScript.Type[], headerFile: IO.FileWriter): void
//{
//    var typeName: string = type.symbol.name + "_proxy";

//    for (var index = 0; index < implementsList.length; index++)
//    {
//        var implementedType: TypeScript.Type = implementsList[index];
//        var implementedTypeName: string = implementedType.symbol.name + "_proxy";

//        headerFile.write("\n\
//    " + typeName + "(" + implementedTypeName + " value) :\n\
//        jsrt::object(value.handle())\n\
//    {\n\
//    }");

//        headerFile.write("\n\
//\n\
//    operator " + implementedTypeName + "()\n\
//    {\n\
//        return " + implementedTypeName + "(*this);\n\
//    }");
//    }
//}

//function writeTypeDeclaration(type: TypeScript.Type, headerFile: IO.FileWriter): void
//{
//    var symbol: TypeScript.Symbol = type.symbol;
//    var typeName: string = symbol.name + "_proxy";
//    var declarationName: string = typeName;
//    var baseName: string = "jsrt::object";

//    if (type.call)
//    {
//        baseName = javaScriptFunctionType(null, type.call.signatures[0]);
//    }

//    headerFile.write("\n\
//class " + declarationName + ": public " + baseName + "\n\
//{\n\
//public:\n\
//    " + typeName + "() :\n\
//        " + baseName + "()\n\
//    {\n\
//    }\n\
//\n\
//    explicit " + typeName + "(jsrt::object object) :\n\
//        " + baseName + "(object.handle())\n\
//    {\n\
//    }");

//    if (type.call)
//    {
//        headerFile.write("\n\
//\n\
//    " + typeName + "(Signature signature) :\n\
//        " + baseName + "(signature)\n\
//    {\n\
//    }");
//    }

//    if (type.isClassInstance())
//    {
//        writePrototypeDeclaration(type, headerFile);
//        headerFile.writeLine();

//        headerFile.write("\n\
//\n\
//    prototype_proxy prototype_object()\n\
//    {\n\
//        return prototype_proxy(prototype);\n\
//    }\n\
//\n\
//    void set_prototype_object(prototype_proxy prototype)\n\
//    {\n\
//        this->prototype = prototype;\n\
//    }");
//    }

//    if (type.implementsList && type.implementsList.length > 0)
//    {
//        writeTypeImplements(type, type.implementsList, headerFile);
//    }

//    if (type.extendsList && type.extendsList.length > 0)
//    {
//        writeTypeImplements(type, type.extendsList, headerFile);
//    }

//    if (type.isModuleType())
//    {
//        var moduleType: TypeScript.ModuleType = <TypeScript.ModuleType>type;

//        writeNestedTypeDeclarations(moduleType.enclosedTypes, headerFile);
//        writeNestedTypeDeclarations(moduleType.ambientEnclosedTypes, headerFile);
//    }

//    writeTypeMemberDeclarations(type, type.members, null, headerFile);
//    writeTypeMemberDeclarations(type, type.ambientMembers, null, headerFile);
    
//    headerFile.write("\n};");
//}

//function writeTypeForwardDeclarations(types: TypeScript.Type[], headerFile: IO.FileWriter): void
//{
//    if (types.length == 0)
//    {
//        return;
//    }

//    headerFile.writeLine();

//    for (var index: number = 0; index < types.length; index++)
//    {
//        headerFile.write("\nclass " + types[index].symbol.name + "_proxy;");
//    }
//}

//function writeScriptDeclaration(baseName: string, script: TypeScript.Script, types: TypeScript.Type[], headerFile: IO.FileWriter): void
//{
//    // We only want the types that are named top-level declarations. (And we don't want the class containers, just the instance types.)
//    types = types.filter(
//        (type: TypeScript.Type) => 
//            !isAnonymous(type) && 
//            !type.isClass() &&
//            type.symbol.container.name == TypeScript.globalId);

//    writeTypeForwardDeclarations(types.filter((type: TypeScript.Type) => type.symbol.container.name == TypeScript.globalId), headerFile);
                
//    if (types.length > 0)
//    {
//        for (var index: number = 0; index < types.length; index++)
//        {
//            var type: TypeScript.Type = types[index];
//            headerFile.writeLine();
//            writeTypeDeclaration(type, headerFile);
//        }
//    }

//    if (types.length > 0)
//    {
//        headerFile.writeLine();
//    }

//    headerFile.write("\n\n\
//class " + baseName + "_global_proxy: public jsrt::object\n\
//{\n\
//public:\n\
//    " + baseName + "_global_proxy() :\n\
//        jsrt::object()\n\
//    {\n\
//    }\n\
//\n\
//    explicit " + baseName + "_global_proxy(jsrt::object object) :\n\
//        jsrt::object(object.handle())\n\
//    {\n\
//    }");

//    for (var index: number = 0; index < script.bod.members.length; index++)
//    {
//        var ast: TypeScript.AST = script.bod.members[index];

//        switch (ast.nodeType)
//        {
//            case TypeScript.NodeType.VarDecl:
//                writeFieldDeclaration(null, (<TypeScript.VarDecl>ast).id.text, ast.type, headerFile);
//                break;

//            case TypeScript.NodeType.FuncDecl:
//                writeFieldDeclaration(null, (<TypeScript.FuncDecl>ast).name.text, ast.type, headerFile);
//                break;

//            case TypeScript.NodeType.ES6Class:
//                writeFieldDeclaration(null, (<TypeScript.ES6ClassDecl>ast).name.text, ast.type, headerFile);
//                break;

//            case TypeScript.NodeType.Module:
//                writeFieldDeclaration(null, (<TypeScript.ModuleDecl>ast).name.text, ast.type, headerFile);
//                break;

//            case TypeScript.NodeType.Interface:
//            case TypeScript.NodeType.Empty:
//            default:
//                // ignore;
//                break;
//        }
//    }

//    headerFile.write("\n};");
//}

function writeDeclarationsPrologue(baseName: string, file: string): string
{
    file += "\
// This file contains automatically generated proxies for JavaScript.\n\
\n\
#include \"jsrt.wrappers.h\"";

    return file;
}

function writeDeclarationsEpilogue(file: string): string
{
    return file;
}

//function checkSignatureGroup(fileName: string, type: TypeScript.Type, group: TypeScript.SignatureGroup, types: TypeScript.Type[]): boolean
//{
//    if (group.signatures.length > 1)
//    {
//        reportError(fileName, ErrorCode.OverloadingNotAllowed);
//        return false;
//    }

//    var signature: TypeScript.Signature = group.signatures[0];

//    for (var index: number = 0; index < signature.parameters.length; index++)
//    {
//        var parameter: TypeScript.ParameterSymbol = signature.parameters[index];

//        if (!checkType(fileName, parameter.getType(), types))
//        {
//            return false;
//        }
//    }

//    return checkType(fileName, signature.returnType.type, types);
//}

//function checkMembers(fileName: string, members: TypeScript.ScopedMembers, types: TypeScript.Type[]): boolean
//{
//    if (members && members.allMembers.count() > 0)
//    {
//        if (members.privateMembers.count() > 0)
//        {
//            reportError(fileName, ErrorCode.PrivateMembersNotAllowed);
//            return false;
//        }

//        if (!members.publicMembers.every(
//            function (name: string, symbol: TypeScript.Symbol, context: any) 
//            { 
//                return checkType(fileName, symbol.getType(), types)
//            }, null))
//        {
//            return false;
//        }
//    }

//    return true;
//}

//function checkType(fileName: string, type: TypeScript.Type, types: TypeScript.Type[]): boolean
//{
//    if (!type)
//    {
//        reportError(fileName, ErrorCode.UnsupportedType);
//        return false;
//    }
//    else if (type.primitiveTypeClass != TypeScript.Primitive.None)
//    {
//        if (type.primitiveTypeClass == TypeScript.Primitive.Boolean ||
//            type.primitiveTypeClass == TypeScript.Primitive.Double ||
//            type.primitiveTypeClass == TypeScript.Primitive.String ||
//            type.primitiveTypeClass == TypeScript.Primitive.Void ||
//            type.primitiveTypeClass == TypeScript.Primitive.Any)
//        {
//            return true;
//        }
//        else
//        {
//            reportError(fileName, ErrorCode.UnsupportedType);
//            return false;
//        }
//    }
//    else if (type.isArray())
//    {
//        return checkType(fileName, type.elementType, types);
//    }
//    else if (types[type.typeID])
//    {
//        return true;
//    }

//    types[type.typeID] = type;

//    if (type.index)
//    {
//        reportError(fileName, ErrorCode.IndexersNotAllowed);
//        return false;
//    }

//    if (type.call)
//    {
//        //if (!isAnonymous(type))
//        //{
//        //    reportError(fileName, ErrorCode.CallInNonAnonymousTypeNotAllowed);
//        //    return false;
//        //}
//        //else 
//        if (type.construct)
//        {
//            reportError(fileName, ErrorCode.CallAndConstructNotAllowed);
//            return false;
//        }
//        if (!checkSignatureGroup(fileName, type, type.call, types))
//        {
//            return false;
//        }
//    }

//    if (type.construct)
//    {
//        if (!isAnonymous(type) && !type.isClass())
//        {
//            reportError(fileName, ErrorCode.ConstructInNonAnonymousTypeNonClassNotAllowed);
//            return false;
//        }
//        else if (type.construct && !checkSignatureGroup(fileName, type, type.construct, types))
//        {
//            return false;
//        }
//    }

//    if (isAnonymous(type) && type.members && type.members.allMembers.count() > 0)
//    {
//        reportError(fileName, ErrorCode.NonFunctionAnonymousTypesNotAllowed);
//        return false;
//    }

//    if (type.isClass())
//    {
//        if (type.extendsList && type.extendsList.length > 0)
//        {
//            reportError(fileName, ErrorCode.ClassExtensionNotAllowed);
//            return false;
//        }

//        // All classes have a static prototype property on their class
//        if (type.members.allMembers.count() > 1)
//        {
//            reportError(fileName, ErrorCode.StaticMembersNotAllowed);
//            return false;
//        }

//        if (!checkType(fileName, type.instanceType, types))
//        {
//            return false;
//        }
//    }

//    return checkMembers(fileName, type.members, types) && checkMembers(fileName, type.ambientMembers, types);
//}

function checkDocument(fileName: string, document: TypeScript.Document, types: TypeScript.PullTypeSymbol[]): boolean
{
    if (!document.isDeclareFile())
    {
        reportError(fileName, ErrorCode.NotADeclareFile);
        return false;
    }

    if (document.isExternalModule())
    {
        reportError(fileName, ErrorCode.ExternalModulesNotAllowed);
        return false;
    }

    var sourceUnit: TypeScript.SourceUnit = document.sourceUnit();

    for (var index: number = 0; index < sourceUnit.moduleElements.childCount(); index++)
    {
        var ast: TypeScript.AST = sourceUnit.moduleElements.childAt(index);
        switch (ast.kind())
        {
            case TypeScript.SyntaxKind.VariableStatement:
            case TypeScript.SyntaxKind.FunctionDeclaration:
            case TypeScript.SyntaxKind.InterfaceDeclaration:
            case TypeScript.SyntaxKind.ClassDeclaration:
            case TypeScript.SyntaxKind.ModuleDeclaration:
                //if (!checkType(fileName, ast.type, types))
                //{
                //    return false;
                //}
                break;

            case TypeScript.SyntaxKind.EmptyStatement:
                // ignore;
                break;

            default:
                reportError(fileName, ErrorCode.UnexpectedDeclaration, ast.kind().toString());
                return false;
        }
    }

    return true;
}

function printLogo(): void
{
    console.log("TsIdl Version 1.0");
    console.log("Copyright (C) Paul Vick. All rights reserved.");
    console.log();
}

function main()
{
    var ioHost: TypeScript.IIO = TypeScript.IO;
    var optionProcessor: Options.OptionProcessor = new Options.OptionProcessor();
    var noLogo: boolean;
    var help: boolean;

    optionProcessor.option("nologo",
    {
        flag: true,
        usage: "Suppress logo display",
        set: ()=>
        {
            noLogo = true;
        }
    });

    optionProcessor.option('help',
    {
        usage: 'Print this message',
        set: ()=>
        {
            printLogo();
            optionProcessor.printUsage();
            help = true;
        }
    }, 'h');

    var files: string[] = optionProcessor.parse(ioHost.arguments);

// ReSharper disable once ConditionIsAlwaysConst
    if (help)
// ReSharper disable once HeuristicallyUnreachableCode
    {
        return 0;
    }

// ReSharper disable once ConditionIsAlwaysConst
    if (!noLogo)
    {
        printLogo();
    }

    if (!files || files.length == 0)
    {
        reportError("tsidl", ErrorCode.NoFiles);
        return 1;
    }

    if (files.length > 1)
    {
        reportError("tsidl", ErrorCode.MultipleFiles);
        return 1;
    }

    var script: string = "";

    try
    {
        var scriptFile: TypeScript.FileInformation = ioHost.readFile(files[0], null);
        script = scriptFile.contents;
    }
    catch (err)
    {
        reportError("tsidl", ErrorCode.CouldNotReadFile, files[0]);
    }

    var document: TypeScript.Document = compile(script, files[0], ioHost);

    if (!document)
    {
        return 1;
    }

    var fileName: string = getFileName(files[0]);
    var types: TypeScript.PullTypeSymbol[] = [];

    if (!checkDocument(fileName, document, types))
    {
        return 1;
    }

    var headerFile: string = "";
    var baseName: string = getFileNameWithoutExtension(files[0]);
    var headerFileName: string = baseName + ".proxy.h";

    try
    {
        ioHost.stdout.WriteLine(baseName);
        if ((/\.d$/i).test(baseName))
        {
            baseName = baseName.substring(0, baseName.length - 2);
        }

        headerFile = writeDeclarationsPrologue(baseName, headerFile);
        //    writeScriptDeclaration(baseName, scriptAST, types, headerFile);
        headerFile = writeDeclarationsEpilogue(headerFile);

        ioHost.writeFile(headerFileName, headerFile, false);
    }
    catch (err)
    {
        reportError("tsidl", ErrorCode.CantOpenOutputFile, headerFileName);
    }

    return 0;
}

main();