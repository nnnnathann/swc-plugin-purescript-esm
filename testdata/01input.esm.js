import ___Control_Apply_index_js_521e53e5 from "../Control.Apply/index.js";
import ___Data_Functor_index_js_88a73d06 from "../Data.Functor/index.js";
import ___Data_Unit_index_js_5942122b from "../Data.Unit/index.js";
import ___Type_Proxy_index_js_7e08e8bd from "../Type.Proxy/index.js";
;
var Control_Apply = ___Control_Apply_index_js_521e53e5;
var Data_Functor = ___Data_Functor_index_js_88a73d06;
var Data_Unit = ___Data_Unit_index_js_5942122b;
var Type_Proxy = ___Type_Proxy_index_js_7e08e8bd;
var pure = function pure(dict) {
    return dict.pure;
};
var unless = function unless(dictApplicative) {
    return function(v) {
        return function(v1) {
            if (!v) {
                return v1;
            }
            ;
            if (v) {
                return pure(dictApplicative)(Data_Unit.unit);
            }
            ;
            throw new Error("Failed pattern match at Control.Applicative (line 66, column 1 - line 66, column 65): " + [
                v.constructor.name,
                v1.constructor.name
            ]);
        };
    };
};
var when = function when(dictApplicative) {
    return function(v) {
        return function(v1) {
            if (v) {
                return v1;
            }
            ;
            if (!v) {
                return pure(dictApplicative)(Data_Unit.unit);
            }
            ;
            throw new Error("Failed pattern match at Control.Applicative (line 61, column 1 - line 61, column 63): " + [
                v.constructor.name,
                v1.constructor.name
            ]);
        };
    };
};
var liftA1 = function liftA1(dictApplicative) {
    return function(f) {
        return function(a) {
            return Control_Apply.apply(dictApplicative.Apply0())(pure(dictApplicative)(f))(a);
        };
    };
};
var applicativeProxy = {
    pure: function pure(v) {
        return Type_Proxy["Proxy"].value;
    },
    Apply0: function Apply0() {
        return Control_Apply.applyProxy;
    }
};
var applicativeFn = {
    pure: function pure(x) {
        return function(v) {
            return x;
        };
    },
    Apply0: function Apply0() {
        return Control_Apply.applyFn;
    }
};
var applicativeArray = {
    pure: function pure(x) {
        return [
            x
        ];
    },
    Apply0: function Apply0() {
        return Control_Apply.applyArray;
    }
};
export { pure };
export { liftA1 };
export { unless };
export { when };
export { applicativeFn };
export { applicativeArray };
export { applicativeProxy };
var apply__e3459111 = Control_Apply.apply;
export { apply__e3459111 as "apply" };
var map__eda6f10e = Data_Functor.map;
export { map__eda6f10e as "map" };
var void__0ebe8b37 = Data_Functor["void"];
export { void__0ebe8b37 as "void" };
var $$default = {
    pure: pure,
    liftA1: liftA1,
    unless: unless,
    when: when,
    applicativeFn: applicativeFn,
    applicativeArray: applicativeArray,
    applicativeProxy: applicativeProxy,
    apply: Control_Apply.apply,
    map: Data_Functor.map,
    "void": Data_Functor["void"]
};
export default $$default;
