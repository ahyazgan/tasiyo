import { useEffect } from "react";

export default function SEO({ title, description }) {
  useEffect(() => {
    document.title = title ? `${title} | YÜKLET` : "YÜKLET — Yuk & Nakliye Eslestirme Platformu";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", description || "Turkiye'nin yuk & nakliye eslestirme platformu. Hafriyat ve silobas isleri dogru aracla bulusuyor.");
    } else {
      const newMeta = document.createElement("meta");
      newMeta.name = "description";
      newMeta.content = description || "Turkiye'nin yuk & nakliye eslestirme platformu.";
      document.head.appendChild(newMeta);
    }
  }, [title, description]);
  return null;
}
