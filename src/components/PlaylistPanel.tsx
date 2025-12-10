"use client";

import { useState } from "react";
import { Plus, Music, ListMusic } from "lucide-react";

export default function PlaylistPanel({
  playlists,
  userPlaylists,
  onSelectPlaylist,
  onCreatePlaylist,
}) {
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="p-4 bg-black/70 backdrop-blur-md border border-gray-700 rounded-lg text-white max-h-[70vh] overflow-y-auto">

      {/* === Playlist general === */}
      <div
        onClick={() => onSelectPlaylist("all")}
        className="p-3 rounded-md cursor-pointer bg-purple-900/20 mb-3 hover:bg-purple-900/40 transition flex items-center gap-3"
      >
        <ListMusic className="w-5 h-5 text-purple-300" />
        <span className="font-semibold">Todas las canciones</span>
      </div>

      {/* === Playlists del sistema === */}
      <h3 className="text-sm uppercase text-gray-400 mb-2">Playlists destacadas</h3>
      {playlists.map((pl) => (
        <div
          key={pl.id}
          onClick={() => onSelectPlaylist(pl.id)}
          className="p-3 rounded-md cursor-pointer hover:bg-gray-800 transition flex items-center gap-3"
        >
          <Music className="w-4 h-4 text-yellow-300" />
          <span>{pl.name}</span>
        </div>
      ))}

      {/* === Playlists del usuario === */}
      <h3 className="text-sm uppercase text-gray-400 mt-6 mb-2">
        Mis playlists
      </h3>

      {userPlaylists.length === 0 && (
        <p className="text-gray-500 text-sm mb-3">Aún no has creado playlists</p>
      )}

      {userPlaylists.map((pl) => (
        <div
          key={pl.id}
          onClick={() => onSelectPlaylist(pl.id)}
          className="p-3 rounded-md cursor-pointer hover:bg-gray-700 transition flex items-center gap-3"
        >
          <ListMusic className="w-4 h-4 text-green-300" />
          <span>{pl.name}</span>
        </div>
      ))}

      {/* === Botón para crear playlist === */}
      <button
        onClick={() => setShowCreate(true)}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-purple-700 hover:bg-purple-800 rounded-md text-white font-semibold transition"
      >
        <Plus className="w-4 h-4" />
        Crear nueva playlist
      </button>

      {/* === Modal de creación === */}
      {showCreate && (
        <div className="mt-4 border-t border-gray-700 pt-4">
          <h4 className="font-semibold mb-2">Nueva Playlist</h4>
          <input
            className="w-full p-2 rounded bg-gray-800 text-white mb-2"
            placeholder="Nombre"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            className="w-full p-2 rounded bg-gray-800 text-white mb-2"
            placeholder="Descripción"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />

          <button
            className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-md"
            onClick={() => {
              onCreatePlaylist({ name: newName, description: newDesc });
              setNewName("");
              setNewDesc("");
              setShowCreate(false);
            }}
          >
            Guardar
          </button>

          <button
            className="w-full py-2 mt-2 bg-gray-700 hover:bg-gray-800 rounded-md"
            onClick={() => setShowCreate(false)}
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
