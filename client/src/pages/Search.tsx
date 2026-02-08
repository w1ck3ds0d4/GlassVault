import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { Search as SearchIcon, FileText } from "lucide-react";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await api.searchDocuments(query);
      setResults(data.searchDocuments);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Search Documents</h1>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <SearchIcon size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents by title or content..."
            className="search-input"
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {results && (
        <div className="card">
          <h3>Results ({results.totalCount})</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Classification</th>
              </tr>
            </thead>
            <tbody>
              {results.documents.map((doc: any) => (
                <tr key={doc.id}>
                  <td>
                    <Link to={`/documents/${doc.id}`}>
                      <FileText size={14} /> {doc.title}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge badge-${doc.classification}`}>
                      {doc.classification}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {results.totalCount > results.pageSize && (
            <p className="pagination-info">
              Showing page {results.page} of {Math.ceil(results.totalCount / results.pageSize)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
