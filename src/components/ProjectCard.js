import React from "react";

const ProjectCard = ({ name, owner, value, status }) => {
  return (
    <div className="w-full max-w-md p-4 mb-4 rounded-lg shadow-md border bg-white text-gray-800">
      <h2 className="text-lg font-semibold">{name}</h2>
      <p className="text-sm text-gray-600">Owner: {owner}</p>
      <p className="text-sm text-gray-600">Value: Rp. {value}</p>
      <p
        className={`text-sm font-medium ${
          status === "completed" ? "text-green-500" : "text-yellow-500"
        }`}
      >
        Status: {status}
      </p>
    </div>
  );
};

export default ProjectCard;
