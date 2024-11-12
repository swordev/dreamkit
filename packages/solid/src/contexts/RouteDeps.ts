import type { useLocation, useNavigate, useParams } from "@solidjs/router";
import { createContext, useContext } from "solid-js";

export const RouteDepsContext = createContext<{
  useNavigate: typeof useNavigate;
  useLocation: typeof useLocation;
  useParams: typeof useParams;
}>();

export const useRouteDeps = function () {
  const context = useContext(RouteDepsContext);
  if (!context) throw new Error("No $RouteContext found");
  return context;
};
