import { useEffect, useMemo, useState } from "react";
import api from "../api";

function normalizeDescription(value) {
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object") {
          if (typeof entry.text === "string") return entry.text;
          if (Array.isArray(entry.richText)) {
            return entry.richText.map((part) => part?.text || "").join(" ");
          }
          return Object.values(entry)
            .filter((item) => typeof item === "string")
            .join(" ");
        }
        return "";
      })
      .join(" ")
      .trim();
  }
  if (value && typeof value === "object") {
    if (typeof value.text === "string") return value.text.trim();
    if (Array.isArray(value.richText)) {
      return value.richText.map((part) => part?.text || "").join(" ").trim();
    }
  }
  return "";
}

function Dashboard() {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchNews = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get("/news", { params: { limit: 6 } });
        if (cancelled) return;
        const items = Array.isArray(response?.data?.data) ? response.data.data : [];
        setNews(items);
      } catch (err) {
        if (cancelled) return;
        console.error("fetch news error:", err);
        const message =
          err?.response?.data?.message || "Unable to load latest news. Please try again later.";
        setError(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchNews();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasNews = useMemo(() => Array.isArray(news) && news.length > 0, [news]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-content">
        <header className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Quick snapshot of the newest posts in the system.</p>
        </header>

        <section className="dashboard-news">
          <div className="dashboard-news__head">
            <h2>Latest News</h2>
            {hasNews && <span>{`${news.length} bài viết`}</span>}
          </div>

          {isLoading && (
            <div className="dashboard-news__state">Đang tải danh sách tin tức...</div>
          )}

          {!isLoading && error && (
            <div className="dashboard-news__state dashboard-news__state--error">{error}</div>
          )}

          {!isLoading && !error && !hasNews && (
            <div className="dashboard-news__state">
              Chưa có bài viết nào. Hãy tạo bài viết đầu tiên!
            </div>
          )}

          {!isLoading && !error && hasNews && (
            <ul className="dashboard-news__list">
              {news.map((item) => {
                const title = typeof item?.title === "string" ? item.title : "Không có tiêu đề";
                const description =
                  normalizeDescription(item?.description) ||
                  "Chưa có mô tả cho bài viết này.";
                const createdAt = item?.createdAt ? new Date(item.createdAt) : null;
                const formattedDate = createdAt
                  ? createdAt.toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" })
                  : "Không rõ thời gian";

                const categories = Array.isArray(item?.categories)
                  ? item.categories.slice(0, 3)
                  : [];

                return (
                  <li key={item?._id || item?.slugId || title} className="dashboard-news__item">
                    <div className="dashboard-news__info">
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </div>
                    <div className="dashboard-news__meta">
                      <span>{formattedDate}</span>
                      {categories.length > 0 && (
                        <div className="dashboard-news__tags">
                          {categories.map((cat, index) => (
                            <span key={`${item?._id || title}-tag-${index}`}>
                              {cat?.value || cat?.label || cat?.slug || String(cat)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
