import React from "react";
import "./Telemedicine.css";

export default function Telemedicine() {
  return (
    <div className="hub-body">
      <div className="hub-feature-card glass-card border-indigo">
        <div className="feature-card-details">
          <h2>Telemedicine Consultation</h2>
          <p>
            Book an appointment or start a video call with doctors.
          </p>
          <div className="telemedicine-actions">
            <button className="btn">Book Appointment</button>
            <button className="btn video">Start Video Call</button>
          </div>
        </div>
      </div>
    </div>
  );
}


