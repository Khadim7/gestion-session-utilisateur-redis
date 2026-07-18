import { useState } from "react";
import { api, Preferences } from "../api";
import { Lang, t } from "../i18n";

interface Props {
  preferences: Preferences;
  lang: Lang;
  onUpdated: (preferences: Preferences) => void;
}

export default function PreferencesForm({ preferences, lang, onUpdated }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const strings = t(lang);

  async function update(partial: Partial<Preferences>) {
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.updatePreferences(partial);
      onUpdated(res.preferences);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel">
      <h3>{strings.preferencesTitle}</h3>
      <p className="muted small">{strings.preferencesDesc}</p>

      <div className="pref-row">
        <span>{strings.theme}</span>
        <div className="segmented">
          {(["clair", "sombre"] as const).map((value) => (
            <button
              key={value}
              className={preferences.theme === value ? "active" : ""}
              onClick={() => update({ theme: value })}
              disabled={saving}
            >
              {value === "clair" ? strings.themeLight : strings.themeDark}
            </button>
          ))}
        </div>
      </div>

      <div className="pref-row">
        <span>{strings.language}</span>
        <div className="segmented">
          {(["fr", "en"] as const).map((value) => (
            <button
              key={value}
              className={preferences.langue === value ? "active" : ""}
              onClick={() => update({ langue: value })}
              disabled={saving}
            >
              {value.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {saved && <div className="saved-tag">{strings.saved}</div>}
    </div>
  );
}
