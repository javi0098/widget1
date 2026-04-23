import { React, AllWidgetProps, SessionManager } from 'jimu-core';
import { useEffect, useRef, useState } from 'react';

const API_BASE = "https://services.gna.gob.ar/is/external/api.load/webapi/service";

export default function Widget(props: AllWidgetProps<any>) {

  const [media, setMedia] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const session = SessionManager.getInstance().getMainSession();
  const token = session?.token || "";
  const username = session?.username || "no_user";

  // 🔹 cargar datos backend
  const loadData = async (t: string) => {
    try {
      let res = await fetch(`${API_BASE}/reports_data?service=webform_test&user=${username}&token=${t}`);

      if (res.status === 401) throw new Error("Token inválido");

      const json = await res.json();
      processMedia(json.reports_data || []);

    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 procesar multimedia
  const processMedia = (reports) => {
    const items: any[] = [];

    reports.forEach(r => {
      r.reports.forEach(rep => {
        const files = [
          ...(rep.image?.split(",") || []),
          ...(rep.audio?.split(",") || []),
          ...(rep.video?.split(",") || [])
        ];

        files.forEach(file => {
          if (!file.trim()) return;

          let type = "video";
          if (rep.image?.includes(file)) type = "image";
          if (rep.audio?.includes(file)) type = "audio";

          items.push({
            file,
            type,
            timestamp: rep.timestamp,
            escuela: r.ESCUELA,
            responsable: r.RESPONSABLE
          });
        });
      });
    });

    setMedia(items.sort((a, b) => b.timestamp - a.timestamp));
  };

  // 🔹 init
  useEffect(() => {
    if (token) loadData(token);
  }, [token]);

  // 🔹 autoplay video interno
  useEffect(() => {
    if (media[index]?.type === "video" && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [index, media]);

  if (!media.length) return <div>Cargando...</div>;

  const item = media[index];

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>

      {/* 🎬 YOUTUBE (FIJO ARRIBA) */}
      <div style={{ flex: "0 0 300px", marginBottom: 10 }}>
        <iframe
          width="100%"
          height="300"
          src="https://www.youtube.com/embed/cb12KmMMDJA"
          title="YouTube video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* 📦 CONTENIDO DINÁMICO */}
      <div style={{ flex: 1, overflow: "auto" }}>

        <h3>{item.escuela}</h3>

        {/* VIDEO */}
        {item.type === "video" && (
          <video
            ref={videoRef}
            controls
            style={{ width: "100%" }}
            src={`${API_BASE}/file?media=video&name=${item.file}&token=${token}`}
          />
        )}

        {/* AUDIO */}
        {item.type === "audio" && (
          <audio controls autoPlay>
            <source src={`${API_BASE}/file?media=audio&name=${item.file}&token=${token}`} />
          </audio>
        )}

        {/* IMAGE */}
        {item.type === "image" && (
          <img
            style={{ width: "100%" }}
            src={`${API_BASE}/file?media=image&name=${item.file}&token=${token}`}
          />
        )}

        {/* CONTROLES */}
        <div style={{ marginTop: 10 }}>
          <button onClick={() => setIndex((index - 1 + media.length) % media.length)}>⬅</button>
          <button onClick={() => setIndex((index + 1) % media.length)}>➡</button>
        </div>

      </div>
    </div>
  );
}
