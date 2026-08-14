import React from "react";
import "./Telemedicine.css";

export default function Telemedicine() {
  return (
    <div className="telemedicine-container">
      <h2>Telemedicine Consultation</h2>
      <p>Book an appointment or start a video call with doctors.</p>
      <button className="btn">Book Appointment</button>
      <button className="btn video">Start Video Call</button>
    </div>
  );
}

