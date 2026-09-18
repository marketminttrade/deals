import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { BROKER_AUTH_STORAGE_KEY, LEGACY_BROKER_AUTH_STORAGE_KEY, brokerApi, publicApi } from "../api/client";

const BrokerAuthContext = createContext(null);

const CLIENT_STORAGE_KEY = "dealsrewards:selected-client";

export function BrokerAuthProvider({ children }) {
  const [broker, setBroker] = useState(null);
  const [selectedClient, setSelectedClientState] = useState(() => {
    try {
      const saved = localStorage.getItem(CLIENT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const setSelectedClient = useCallback((client) => {
    setSelectedClientState(client);
    if (client) {
      localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(client));
    } else {
      localStorage.removeItem(CLIENT_STORAGE_KEY);
    }
  }, []);

  const refreshClients = useCallback(async () => {
    const response = await brokerApi.get("/api/broker-portal/clients");
    const clients = response.data?.clients || response.data || [];
    setSelectedClientState((previous) => {
      const next = clients.find((client) => client._id === previous?._id) || clients[0] || null;
      if (next) localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(CLIENT_STORAGE_KEY);
      return next;
    });
    return clients;
  }, []);

  useEffect(() => {
    async function hydrateBrokerAuth() {
      const token = localStorage.getItem(BROKER_AUTH_STORAGE_KEY) || localStorage.getItem(LEGACY_BROKER_AUTH_STORAGE_KEY);
      if (!token) {
        setLoading(false);
        return;
      }

      localStorage.setItem(BROKER_AUTH_STORAGE_KEY, token);

      try {
        const response = await brokerApi.get("/api/access/me");
        setBroker(response.data.broker);
        await refreshClients();
      } catch (error) {
        localStorage.removeItem(BROKER_AUTH_STORAGE_KEY);
        localStorage.removeItem(LEGACY_BROKER_AUTH_STORAGE_KEY);
        setBroker(null);
        setSelectedClient(null);
      } finally {
        setLoading(false);
      }
    }

    hydrateBrokerAuth();
  }, [refreshClients, setSelectedClient]);

  const login = useCallback(async (tokenId) => {
    const response = await publicApi.post("/api/access/login", { tokenId });
    localStorage.setItem(BROKER_AUTH_STORAGE_KEY, response.data.token);
    localStorage.removeItem(LEGACY_BROKER_AUTH_STORAGE_KEY);
    setBroker(response.data.broker);
    await refreshClients();
    return response.data.broker;
  }, [refreshClients]);

  async function refreshBroker() {
    const response = await brokerApi.get("/api/access/me");
    setBroker(response.data.broker);
    return response.data.broker;
  }

  async function logout() {
    try {
      await brokerApi.post("/api/access/logout");
    } catch (error) {
      // Token removal is enough to end the local broker session.
    } finally {
      localStorage.removeItem(BROKER_AUTH_STORAGE_KEY);
      localStorage.removeItem(LEGACY_BROKER_AUTH_STORAGE_KEY);
      localStorage.removeItem(CLIENT_STORAGE_KEY);
      setBroker(null);
      setSelectedClientState(null);
    }
  }

  const value = useMemo(
    () => ({
      broker,
      selectedClient,
      setSelectedClient,
      isAuthenticated: Boolean(broker),
      loading,
      login,
      logout,
      refreshBroker,
      refreshClients,
    }),
    [broker, selectedClient, loading, login, refreshClients, setSelectedClient]
  );

  return <BrokerAuthContext.Provider value={value}>{children}</BrokerAuthContext.Provider>;
}

export function useBrokerAuth() {
  const context = useContext(BrokerAuthContext);
  if (!context) {
    throw new Error("useBrokerAuth must be used within BrokerAuthProvider.");
  }

  return context;
}
