import {
  Activity,
  CheckCircle2,
  ChefHat,
  Clock3,
  Eye,
  EyeOff,
  Flame,
  RefreshCcw,
  Search,
  Sparkles,
  Wifi,
  WifiOff
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import dishFallback from "./assets/dish-fallback.svg";
import heroDish from "./assets/hero-dish.svg";

const API_BASE = "https://food-management-api-enoa.onrender.com";

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function formatStatus(dish) {
  return dish.isPublished ? "Published" : "Unpublished";
}

function useFallbackImage(event) {
  if (event.currentTarget.src !== dishFallback) {
    event.currentTarget.src = dishFallback;
  }
}

export default function App() {
  const [dishes, setDishes] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDishId, setPendingDishId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  async function fetchDishes() {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/dishes`);

      if (!response.ok) {
        throw new Error("Unable to fetch dishes");
      }

      const data = await response.json();
      setDishes(data);
      setLastSync(new Date());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDishes();

    const socket = io("https://food-management-api-enoa.onrender.com", {
  transports: ["websocket", "polling"]
});

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("dishes:changed", (nextDishes) => {
      setDishes(nextDishes);
      setLastSync(new Date());
    });
    socket.on("dish:updated", (updatedDish) => {
      setDishes((currentDishes) =>
        currentDishes.map((dish) =>
          dish.dishId === updatedDish.dishId ? updatedDish : dish
        )
      );
      setLastSync(new Date());
    });

    return () => socket.disconnect();
  }, []);

  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      const matchesSearch = dish.dishName.toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && dish.isPublished) ||
        (statusFilter === "unpublished" && !dish.isPublished);

      return matchesSearch && matchesStatus;
    });
  }, [dishes, query, statusFilter]);

  const publishedCount = dishes.filter((dish) => dish.isPublished).length;
  const unpublishedCount = dishes.length - publishedCount;
  const publishRate = dishes.length ? Math.round((publishedCount / dishes.length) * 100) : 0;

  async function toggleDish(dish) {
    const originalDishes = dishes;
    setPendingDishId(dish.dishId);
    setError("");

    setDishes((currentDishes) =>
      currentDishes.map((currentDish) =>
        currentDish.dishId === dish.dishId
          ? { ...currentDish, isPublished: !currentDish.isPublished }
          : currentDish
      )
    );

    try {
      const response = await fetch(`${API_BASE}/api/dishes/${dish.dishId}/toggle`, {
        method: "PATCH"
      });

      if (!response.ok) {
        throw new Error("Unable to update dish status");
      }

      const updatedDish = await response.json();
      setDishes((currentDishes) =>
        currentDishes.map((currentDish) =>
          currentDish.dishId === updatedDish.dishId ? updatedDish : currentDish
        )
      );
      setLastSync(new Date());
    } catch (requestError) {
      setDishes(originalDishes);
      setError(requestError.message);
    } finally {
      setPendingDishId(null);
    }
  }

  return (
    <main className="app-shell">
      <header className="site-nav">
        <div className="brand">
          <span className="brand-mark">
            <ChefHat size={24} />
          </span>
          <div>
            <p>DishOps</p>
            <span>by Euphotic Labs</span>
          </div>
        </div>

        <nav className="nav-links" aria-label="Dashboard navigation">
          <a href="#overview">Overview</a>
          <a href="#catalog">Catalog</a>
          <a href="#realtime">Realtime</a>
        </nav>

        <button className="nav-action" type="button" onClick={fetchDishes} disabled={isLoading}>
          <RefreshCcw size={17} />
          Refresh
        </button>
      </header>

      <section className="hero-section" id="overview">
        <div className="hero-copy">
          <p className="eyebrow">AI kitchen catalog control</p>
          <h1>Publish dishes with the polish of a premium food-tech brand.</h1>
          <p className="hero-text">
            Manage recipes, preview menu-ready imagery, and watch backend changes reach the dashboard instantly.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="#catalog">
              <Sparkles size={17} />
              Manage catalog
            </a>
            <span className={classNames("connection-chip", isConnected ? "online" : "offline")} id="realtime">
              {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
              {isConnected ? "Realtime live" : "Realtime offline"}
            </span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Dashboard status summary">
          <div className="hero-image-card">
            <img
              src={heroDish}
              alt="Premium plated Indian meal"
            />
            <div className="floating-stat">
              <Flame size={18} />
              <span>{publishRate}% menu live</span>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-band" aria-label="Dish metrics">
        <Metric label="Total dishes" value={dishes.length} icon={<ChefHat size={19} />} />
        <Metric label="Published" value={publishedCount} icon={<CheckCircle2 size={19} />} accent="green" />
        <Metric label="Drafts" value={unpublishedCount} icon={<EyeOff size={19} />} accent="amber" />
        <Metric
          label="Last sync"
          value={lastSync ? lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
          icon={<Clock3 size={19} />}
          accent={isConnected ? "green" : "red"}
        />
      </section>

      <section className="content-panel" id="catalog">
        <header className="section-header">
          <div>
            <p className="eyebrow">Recipe operations</p>
            <h2>Menu readiness</h2>
          </div>
          <div className="sync-panel">
            <Activity size={18} />
            <span>{isConnected ? "Listening for backend changes" : "Socket disconnected"}</span>
          </div>
        </header>

        <div className="toolbar">
          <label className="search-box">
            <Search size={18} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search dishes"
            />
          </label>

          <div className="segmented-control" aria-label="Filter dishes by status">
            {["all", "published", "unpublished"].map((status) => (
              <button
                key={status}
                type="button"
                className={classNames(statusFilter === status && "active")}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {isLoading && dishes.length === 0 ? (
          <div className="empty-state">Loading dishes...</div>
        ) : (
          <div className="dish-grid">
            {filteredDishes.map((dish) => (
              <article className="dish-card" key={dish.dishId}>
                <div className="dish-image-wrap">
                  <img
                    src={dish.imageUrl}
                    alt={dish.dishName}
                    loading="lazy"
                    onError={useFallbackImage}
                  />
                  <span className={classNames("status-pill", dish.isPublished ? "published" : "draft")}>
                    {dish.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
                    {formatStatus(dish)}
                  </span>
                </div>

                <div className="dish-card-body">
                  <div>
                    <span className="dish-id">Dish #{dish.dishId}</span>
                    <h2>{dish.dishName}</h2>
                    <p>{dish.isPublished ? "Visible in the live catalog" : "Hidden from guests"}</p>
                  </div>
                  <button
                    className={classNames("toggle-button", dish.isPublished ? "is-published" : "is-draft")}
                    type="button"
                    onClick={() => toggleDish(dish)}
                    disabled={pendingDishId === dish.dishId}
                    aria-pressed={dish.isPublished}
                  >
                    <span className="switch-track">
                      <span className="switch-thumb" />
                    </span>
                    {pendingDishId === dish.dishId ? "Updating" : dish.isPublished ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!isLoading && filteredDishes.length === 0 && (
          <div className="empty-state">No dishes match the current filters.</div>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, icon, accent = "blue" }) {
  return (
    <div className={classNames("metric-card", accent)}>
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
      </div>
    </div>
  );
}
