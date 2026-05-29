import React from "react";

const UserNotRegisteredError = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md border-2 border-foreground bg-card p-8 shadow-[7px_7px_0_rgba(105,79,93,0.08)]">
        <div className="text-center">
          <div className="mb-6 inline-grid h-16 w-16 place-items-center border-2 border-foreground bg-background">
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="font-display text-5xl uppercase leading-none text-foreground">
            Access restricted
          </h1>
          <p className="mt-4 text-sm font-semibold uppercase leading-6 text-muted-foreground">
            You are not registered to use this application. Contact the app administrator to request access.
          </p>
          <div className="mt-8 border-2 border-foreground bg-background p-4 text-left text-sm font-semibold text-muted-foreground">
            <p className="font-black uppercase text-foreground">
              Check the following:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Verify you are logged in with the correct account</li>
              <li>Contact the app administrator for access</li>
              <li>Try logging out and back in again</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
