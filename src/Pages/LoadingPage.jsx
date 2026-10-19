import React from "react";
import BrandMark from "../Components/BrandMark";

const LoadingPage = () => (
  <div className="dhruva-loader" role="status" aria-live="polite">
    <BrandMark markSize={72} wordSize={48} />
    <span className="dhruva-loader-text">Loading</span>
  </div>
);

export default LoadingPage;
