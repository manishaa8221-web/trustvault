import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Documents() {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/documents")
      .then((res) => res.json())
      .then((data) => setDocuments(data))
      .catch((error) => console.log(error));
  }, []);

  return (
    <div style={{ padding: "30px" }}>
      <h1>Documents</h1>

      {documents.length === 0 ? (
        <p>No documents found</p>
      ) : (
        <ul>
          {documents.map((doc) => (
            <li key={doc._id}>
              <strong>{doc.title}</strong>
            </li>
          ))}
        </ul>
      )}

      <br />

      <Link to="/dashboard">
        Back to Dashboard
      </Link>
    </div>
  );
}

export default Documents;