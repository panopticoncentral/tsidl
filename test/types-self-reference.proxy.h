// This file contains automatically generated proxies for JavaScript.

#include "jsrt.wrappers.h"

namespace types-self-reference {
    class a_proxy: public jsrt::object {
    public:
        a_proxy();
        explicit a_proxy(jsrt::object object);
    };
    class c_proxy: public jsrt::object {
    public:
        c_proxy();
        explicit c_proxy(jsrt::object object);
        class d_proxy: public jsrt::object {
        public:
            d_proxy();
            explicit d_proxy(jsrt::object object);
            class e_proxy: public jsrt::object {
            public:
                e_proxy();
                explicit e_proxy(jsrt::object object);
            };
        }
    }
} // namespace types-self-reference