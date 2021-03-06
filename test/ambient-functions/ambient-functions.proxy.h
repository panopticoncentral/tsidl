// This file contains automatically generated proxies for JavaScript.

#pragma once

#include <jsrt.h>
#include "jsrt-wrappers.h"

namespace ambient_functions
{
    jsrt::bound_function<jsrt::object, jsrt::value> a();
    void set_a(jsrt::function<jsrt::value> value);
    jsrt::bound_function<jsrt::object, double, double> b();
    void set_b(jsrt::function<double, double> value);
    jsrt::bound_function<jsrt::object, double, double, jsrt::optional<double>> c();
    void set_c(jsrt::function<double, double, jsrt::optional<double>> value);
    jsrt::bound_function<jsrt::object, double, double, std::vector<double>> d();
    void set_d(jsrt::function<double, double, std::vector<double>> value);
    jsrt::bound_function<jsrt::object, void> e();
    void set_e(jsrt::function<void> value);
} // namespace ambient_functions
