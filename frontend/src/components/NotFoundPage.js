import React from "react";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "var(--color-hero-bg)",
        color: "var(--color-white-86)",
        textAlign: "center",
        padding: "40px 20px 0 20px", // spinge il contenuto verso l'alto
      }}
    >
      <h1
        style={{
          fontSize: "8rem",
          fontWeight: "bold",
          color: "var(--primary-green)",
          margin: "20px 0 0 0", // un po' di margine sopra il titolo
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontSize: "2rem",
          margin: "10px 0 20px 0",
        }}
      >
        Page Not Found
      </h2>
      <p
        style={{
          fontSize: "1.2rem",
          maxWidth: "500px",
          color: "var(--color-white-72)",
          marginBottom: "40px",
        }}
      >
        The page you are looking for does not exist or has been removed. Return
        to the homepage and continue exploring!
      </p>
      <button
        onClick={() => navigate("/")}
        style={{
          backgroundColor: "var(--primary-green)",
          color: "var(--color-text-on-dark)",
          border: "none",
          padding: "12px 30px",
          fontSize: "1rem",
          fontWeight: "bold",
          borderRadius: "12px",
          cursor: "pointer",
          boxShadow: "0 4px 12px var(--shadow)",
          transition: "all 0.3s ease",
        }}
      >
        Go to Home
      </button>
    </div>
  );
};

export default NotFoundPage;
