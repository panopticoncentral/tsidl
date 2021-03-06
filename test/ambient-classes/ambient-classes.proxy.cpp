// This file contains automatically generated proxies for JavaScript.

#include "ambient-classes.proxy.h"

namespace ambient_classes
{
    a_proxy::a_proxy() :
        jsrt::object()
    {
    }
    a_proxy::a_proxy(jsrt::value value) :
        jsrt::object(value)
    {
    }
    double a_proxy::x()
    {
        return get_property<double>(jsrt::property_id::create(L"x"));
    }
    void a_proxy::set_x(double value)
    {
        set_property(jsrt::property_id::create(L"x"), value);
    }
    jsrt::bound_function<a_proxy, double, double> a_proxy::y()
    {
        return jsrt::bound_function<a_proxy, double, double>(*this, get_property<jsrt::function<double, double>>(jsrt::property_id::create(L"y")));
    }
    void a_proxy::set_y(jsrt::function<double, double> value)
    {
        set_property(jsrt::property_id::create(L"y"), value);
    }
    jsrt::bound_function<jsrt::object, a_proxy, double> a()
    {
        return jsrt::bound_function<jsrt::object, a_proxy, double>(jsrt::context::global(), jsrt::context::global().get_property<jsrt::function<a_proxy, double>>(jsrt::property_id::create(L"a")));
    }
    void set_a(jsrt::function<a_proxy, double> value)
    {
        jsrt::context::global().set_property(jsrt::property_id::create(L"a"), value);
    }
    b_proxy::b_proxy() :
        jsrt::object()
    {
    }
    b_proxy::b_proxy(jsrt::value value) :
        jsrt::object(value)
    {
    }
    double b_proxy::x()
    {
        return get_property<double>(jsrt::property_id::create(L"x"));
    }
    void b_proxy::set_x(double value)
    {
        set_property(jsrt::property_id::create(L"x"), value);
    }
    c_proxy::c_proxy() :
        jsrt::object()
    {
    }
    c_proxy::c_proxy(jsrt::value value) :
        jsrt::object(value)
    {
    }
    c_proxy::c_proxy(b_proxy value) :
        jsrt::object(value)
    {
    }
    c_proxy::operator b_proxy()
    {
        return b_proxy(*this);
    }
    double c_proxy::x()
    {
        return get_property<double>(jsrt::property_id::create(L"x"));
    }
    void c_proxy::set_x(double value)
    {
        set_property(jsrt::property_id::create(L"x"), value);
    }
    jsrt::bound_function<jsrt::object, c_proxy> c()
    {
        return jsrt::bound_function<jsrt::object, c_proxy>(jsrt::context::global(), jsrt::context::global().get_property<jsrt::function<c_proxy>>(jsrt::property_id::create(L"c")));
    }
    void set_c(jsrt::function<c_proxy> value)
    {
        jsrt::context::global().set_property(jsrt::property_id::create(L"c"), value);
    }
    d_proxy::d_proxy() :
        c_proxy()
    {
    }
    d_proxy::d_proxy(jsrt::value value) :
        c_proxy(value)
    {
    }
    jsrt::bound_function<jsrt::object, d_proxy> d()
    {
        return jsrt::bound_function<jsrt::object, d_proxy>(jsrt::context::global(), jsrt::context::global().get_property<jsrt::function<d_proxy>>(jsrt::property_id::create(L"d")));
    }
    void set_d(jsrt::function<d_proxy> value)
    {
        jsrt::context::global().set_property(jsrt::property_id::create(L"d"), value);
    }
} // namespace ambient_classes
