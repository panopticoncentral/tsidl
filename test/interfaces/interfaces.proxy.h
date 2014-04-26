// This file contains automatically generated proxies for JavaScript.

#include <jsrt.h>
#include "jsrt-wrappers.h"

namespace interfaces
{
    class a_proxy: public jsrt::object
    {
    public:
        a_proxy();
        explicit a_proxy(jsrt::object object);
    };
    class b_proxy: public a_proxy
    {
    public:
        b_proxy();
        explicit b_proxy(jsrt::object object);
        explicit b_proxy(a_proxy object);
    };
    class c_proxy: public jsrt::object
    {
    public:
        c_proxy();
        explicit c_proxy(jsrt::object object);
        double x();
        void set_x(double value);
        jsrt::optional<double> y();
        void set_y(jsrt::optional<double> value);
        std::wstring abc();
        void set_abc(std::wstring value);
        jsrt::bound_function<c_proxy, double, double> b();
        void set_b(jsrt::function<double, double> value);
    };
    class d_proxy: public jsrt::function<std::wstring, std::wstring>
    {
    public:
        d_proxy();
        explicit d_proxy(jsrt::object object);
        explicit d_proxy(jsrt::function<std::wstring, std::wstring> object);
        static d_proxy create(Signature signature);
    };
    class e_proxy: public jsrt::function<jsrt::object, std::wstring>
    {
    public:
        e_proxy();
        explicit e_proxy(jsrt::object object);
        explicit e_proxy(jsrt::function<jsrt::object, std::wstring> object);
        static e_proxy create(Signature signature);
    };
    class f_proxy: public d_proxy
    {
    public:
        f_proxy();
        explicit f_proxy(jsrt::object object);
        explicit f_proxy(d_proxy object);
        static f_proxy create(Signature signature);
    };
} // namespace interfaces
