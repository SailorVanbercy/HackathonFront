import React from "react";
import type { MetaDataDTO } from "../../../services/notes/noteService";

interface NoteMetadataBarProps {
    metadata: MetaDataDTO | null;
    isLoading: boolean;
    error: string | null;
    saveStatus: "saved" | "saving" | "dirty";
}

const formatDateTime = (iso: string) => {
    try {
        return new Date(iso).toLocaleString(undefined, {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
};

const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const v = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
    return `${v} ${sizes[i]}`;
};

export const NoteMetadataBar: React.FC<NoteMetadataBarProps> = ({
                                                                    metadata,
                                                                    isLoading,
                                                                    error,
                                                                    saveStatus,
                                                                }) => {
    if (isLoading) {
        return <div className="grim-meta-bar">⏳ Synchronisation...</div>;
    }

    if (error) {
        return <div className="grim-meta-bar error">⚠️ {error}</div>;
    }

    if (!metadata) return null;

    return (
        <div className="grim-meta-bar">
      <span title="Dernière modification">
        🕒 {formatDateTime(metadata.updatedAt)}
      </span>
            <span className="meta-sep">•</span>
            <span>📦 {formatBytes(metadata.byteSize)}</span>
            <span className="meta-sep">•</span>
            <span>🔤 {metadata.characterCount}</span>
            <span className="meta-sep">•</span>
            <span>📝 {metadata.wordCount} mots</span>
            <span className="meta-sep">•</span>
            <span className={`save-status ${saveStatus}`}>
        {saveStatus === "saving"
            ? "⏳ Sauvegarde..."
            : saveStatus === "dirty"
                ? "✍️ Non enregistré"
                : "✅ Enregistré"}
      </span>
        </div>
    );
};