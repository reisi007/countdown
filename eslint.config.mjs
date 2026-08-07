import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      // React Compiler auto-memoizes plain functions, so exhaustive-deps
      // reports false positives for functions referenced inside effects.
      "react-hooks/exhaustive-deps": "off",
    },
  },
];

export default eslintConfig;
