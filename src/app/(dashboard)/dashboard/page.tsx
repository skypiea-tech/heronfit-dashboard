"use client";

import React from "react";

const DashboardPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-text font-header text-3xl mb-4">
        Dashboard Overview
      </h1>
      <p className="text-primary font-body text-base">
        This is a test paragraph to check custom colors and fonts.
      </p>
      <p className="text-accent font-body text-base mt-2">
        This paragraph uses the accent color.
      </p>
      <p className="text-secondary font-body text-base mt-2">
        This paragraph uses the secondary color.
      </p>
    </div>
  );
};

export default DashboardPage;
