import React from "react";

const WelcomeMessage: React.FC = () => {
  return (
    <div className="w-full bg-background shadow-sm border rounded-lg p-8 flex flex-col gap-2">
      <h1 className="font-bold">Welcome to internal company chatbot</h1>
      <p className="text-muted-foreground text-sm">
        This is a simple chatbot that helps customer support agents answer
        questions based on a predefined knowledge base.
      </p>
    </div>
  );
};

export default WelcomeMessage;
