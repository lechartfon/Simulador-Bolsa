import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./RegisterForm.css";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();

  const regex = {
    length: /^.{8,}$/,
    number: /\d/,
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedForm = {
      ...formData,
      [name]: value,
    };

    setFormData(updatedForm);

    if (name === "password") {
      validatePassword(value);
      validateConfirmPassword(value, updatedForm.confirmPassword);
    } else if (name === "confirmPassword") {
      validateConfirmPassword(formData.password, value);
    }
  };

  const validatePassword = (password) => {
    let score = 0;
    let message = "";

    if (regex.length.test(password)) score += 25;
    if (regex.number.test(password)) score += 25;
    if (regex.uppercase.test(password)) score += 25;
    if (regex.lowercase.test(password)) score += 25;

    if (score === 100) {
      message = "Contraseña válida.";
    } else if (!regex.length.test(password)) {
      message = "Debe tener al menos 8 caracteres.";
    } else if (!regex.number.test(password)) {
      message = "Debe incluir al menos un número.";
    } else if (!regex.uppercase.test(password)) {
      message = "Debe incluir al menos una mayúscula.";
    } else if (!regex.lowercase.test(password)) {
      message = "Debe incluir al menos una minúscula.";
    }

    setPasswordStrength(score);
    setPasswordMessage(message);
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (password === confirmPassword && password !== "") {
      setConfirmMessage("Las contraseñas coinciden.");
    } else {
      setConfirmMessage("Las contraseñas no coinciden.");
    }
  };

  const getBarColor = () => {
    if (passwordStrength === 100) return "green";
    if (passwordStrength >= 75) return "yellow";
    if (passwordStrength >= 50) return "orange";
    return "red";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      passwordStrength !== 100 ||
      formData.password !== formData.confirmPassword
    ) {
      setSubmitError("Corrige los errores antes de enviar el formulario.");
      return;
    }

    setSubmitError("");
    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
    };

    try {
      const response = await axios.post(
        "http://localhost:8000/register",
        userData
      );
      console.log("Registro exitoso:", response.data);
      alert("Registro exitoso. Redirigiendo a la página de login.");
      navigate("/login");
    } catch (error) {
      console.error("Error al registrarse:", error.response);
    }
  };

  return (
    <div className="page-container">
      <div className="image-section"></div>
      <div className="form-section">
        <div className="card">
          <div className="card-header">
            <div className="text-header">Register</div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username:</label>
                <input
                  required
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  required
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <input
                  required
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <div
                  id="mensajeContrasena"
                  style={{ color: passwordStrength === 100 ? "green" : "red" }}
                >
                  {passwordMessage}
                </div>
                <div
                  id="barraSeguridad"
                  style={{
                    marginTop: "5px",
                    height: "8px",
                    width: "100%",
                    backgroundColor: "#ccc",
                    visibility: "visible",
                  }}
                >
                  <div
                    id="barra"
                    style={{
                      width: `${passwordStrength}%`,
                      height: "100%",
                      backgroundColor: getBarColor(),
                      transition: "width 0.3s",
                    }}
                  ></div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password:</label>
                <input
                  required
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <div
                  id="mensajeContrasena2"
                  style={{
                    color:
                      formData.password === formData.confirmPassword
                        ? "green"
                        : "red",
                  }}
                >
                  {confirmMessage}
                </div>
              </div>

              {submitError && <p style={{ color: "red" }}>{submitError}</p>}

              <button type="submit" className="btn">
                Register
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
