import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

const GoogleLoginButton = () => {
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="flex w-full items-center justify-center px-2.5 py-3 bg-white text-black border rounded-lg hover:bg-gray-100 transition"
    >
      <FontAwesomeIcon icon={faGoogle} style={{ marginRight: "8px" }} />
      Đăng nhập bằng Google
    </button>
  );
};

export default GoogleLoginButton;
