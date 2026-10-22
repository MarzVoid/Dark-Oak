// ../UpdateModule/src/react/useUpdater.ts
import { useState, useEffect, useCallback } from "react";
function useUpdater(bridgeKey = "updater") {
  const [currentVersion, setCurrentVersion] = useState("...");
  const [targetVersion, setTargetVersion] = useState(null);
  const [status, setStatus] = useState("idle");
  const [percent, setPercent] = useState(0);
  const [bytesLoaded, setBytesLoaded] = useState(0);
  const [bytesTotal, setBytesTotal] = useState(0);
  const [notes, setNotes] = useState("");
  const [releaseUrl, setReleaseUrl] = useState("");
  const [error, setError] = useState(null);
  const getBridge = useCallback(() => {
    return window[bridgeKey];
  }, [bridgeKey]);
  useEffect(() => {
    let mounted = true;
    const bridge = getBridge();
    if (!bridge) return;
    bridge.getVersion?.().then((ver) => {
      if (mounted && ver) {
        setCurrentVersion(ver);
      }
    }).catch(() => {
    });
    const unsubscribe = bridge.onEvent?.((event) => {
      if (!mounted) return;
      switch (event.type) {
        case "checking":
          setStatus("checking");
          setError(null);
          break;
        case "available": {
          setStatus("available");
          const info = event.info;
          if (info?.version) setTargetVersion(info.version);
          if (info?.notes) setNotes(info.notes);
          if (info?.url) setReleaseUrl(info.url);
          break;
        }
        case "none":
          setStatus("up-to-date");
          break;
        case "progress":
          setStatus("downloading");
          setPercent(Math.round(event.percent || 0));
          if (event.loaded !== void 0) setBytesLoaded(event.loaded);
          if (event.total !== void 0) setBytesTotal(event.total);
          break;
        case "downloaded":
          setStatus("downloaded");
          setPercent(100);
          break;
        case "installing":
          setStatus("installing");
          break;
        case "error":
          setStatus("error");
          setError(event.error || "Unknown update error");
          break;
      }
    });
    return () => {
      mounted = false;
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [getBridge]);
  const check = useCallback(async () => {
    const bridge = getBridge();
    if (!bridge) {
      setError("Updater bridge is not found in window");
      setStatus("error");
      return;
    }
    setStatus("checking");
    setError(null);
    try {
      const res = await bridge.check();
      if (!res.ok) {
        setStatus("error");
        setError(res.error || "Update check failed");
        return;
      }
      if (res.hasUpdate && res.info) {
        setStatus("available");
        setTargetVersion(res.info.version);
        setNotes(res.info.notes || "");
        setReleaseUrl(res.info.url || "");
      } else {
        setStatus("up-to-date");
      }
    } catch (err) {
      setStatus("error");
      setError(String(err?.message || err));
    }
  }, [getBridge]);
  const download = useCallback(async () => {
    const bridge = getBridge();
    if (!bridge) return;
    setStatus("downloading");
    setPercent(0);
    setError(null);
    try {
      const res = await bridge.download();
      if (!res.ok) {
        setStatus("error");
        setError(res.error || "Download failed");
      }
    } catch (err) {
      setStatus("error");
      setError(String(err?.message || err));
    }
  }, [getBridge]);
  const install = useCallback(async () => {
    const bridge = getBridge();
    if (!bridge) return;
    setStatus("installing");
    try {
      const res = await bridge.install();
      if (!res.ok) {
        setStatus("error");
        setError(res.error || "Installation failed");
      }
    } catch (err) {
      setStatus("error");
      setError(String(err?.message || err));
    }
  }, [getBridge]);
  return {
    currentVersion,
    targetVersion,
    status,
    percent,
    bytesLoaded,
    bytesTotal,
    notes,
    releaseUrl,
    error,
    isAvailable: status === "available",
    isDownloading: status === "downloading",
    isDownloaded: status === "downloaded",
    check,
    download,
    install
  };
}

// ../UpdateModule/src/react/UpdateCard.tsx
import { useState as useState2 } from "react";

// ../UpdateModule/src/react/UpdateModal.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var UpdateModal = ({
  isOpen,
  onClose,
  version,
  notes
}) => {
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "mzp-updater-modal-backdrop",
      onClick: (e) => {
        if (e.target === e.currentTarget) onClose();
      },
      children: /* @__PURE__ */ jsxs("div", { className: "mzp-updater-modal-panel", children: [
        /* @__PURE__ */ jsxs("div", { className: "mzp-updater-modal-header", children: [
          /* @__PURE__ */ jsxs("div", { className: "mzp-updater-modal-title", children: [
            "\u0421\u043F\u0438\u0441\u043E\u043A \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439 ",
            version ? `v${version}` : ""
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "mzp-updater-modal-close",
              onClick: onClose,
              children: "\xD7"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mzp-updater-modal-content", children: notes ? /* @__PURE__ */ jsx("pre", { className: "mzp-updater-notes-pre", children: notes }) : /* @__PURE__ */ jsx("div", { className: "mzp-updater-notes-empty", children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0440\u0435\u043B\u0438\u0437\u0430 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442" }) }),
        /* @__PURE__ */ jsx("div", { className: "mzp-updater-modal-footer", children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "mzp-updater-btn mzp-updater-btn-secondary",
            onClick: onClose,
            children: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C"
          }
        ) })
      ] })
    }
  );
};

// ../UpdateModule/src/react/UpdateCard.tsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var UpdateCard = ({
  title = "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B",
  description = "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043D\u043E\u0432\u044B\u0445 \u0440\u0435\u043B\u0438\u0437\u043E\u0432",
  className = "",
  bridgeKey = "updater"
}) => {
  const [isModalOpen, setIsModalOpen] = useState2(false);
  const {
    currentVersion,
    targetVersion,
    status,
    percent,
    bytesLoaded,
    bytesTotal,
    notes,
    error,
    check,
    download,
    install
  } = useUpdater(bridgeKey);
  return /* @__PURE__ */ jsxs2("div", { className: `mzp-updater-card ${className}`, children: [
    /* @__PURE__ */ jsxs2("div", { className: "mzp-updater-header", children: [
      /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx2("div", { className: "mzp-updater-title", children: title }),
        /* @__PURE__ */ jsx2("div", { className: "mzp-updater-desc", children: description })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "mzp-updater-version-badge", children: [
        "v",
        currentVersion
      ] })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "mzp-updater-body", children: [
      status === "checking" && /* @__PURE__ */ jsxs2("div", { className: "mzp-updater-status-row", children: [
        /* @__PURE__ */ jsx2("div", { className: "mzp-updater-spinner" }),
        /* @__PURE__ */ jsx2("span", { className: "mzp-updater-status-text", children: "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u043D\u0430\u043B\u0438\u0447\u0438\u044F \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0439..." })
      ] }),
      status === "up-to-date" && /* @__PURE__ */ jsxs2("div", { className: "mzp-updater-status-row mzp-updater-text-success", children: [
        /* @__PURE__ */ jsx2("span", { className: "mzp-updater-dot mzp-updater-dot-success" }),
        /* @__PURE__ */ jsx2("span", { children: "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430 \u0430\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F." })
      ] }),
      status === "available" && /* @__PURE__ */ jsxs2("div", { className: "mzp-updater-status-row mzp-updater-text-highlight", children: [
        /* @__PURE__ */ jsx2("span", { className: "mzp-updater-dot mzp-updater-dot-highlight" }),
        /* @__PURE__ */ jsxs2("span", { children: [
          "\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u0430 \u043D\u043E\u0432\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F: v",
          targetVersion
        ] })
      ] }),
      status === "downloading" && /* @__PURE__ */ jsxs2("div", { className: "mzp-updater-progress-wrapper", children: [
        /* @__PURE__ */ jsxs2("div", { className: "mzp-updater-progress-header", children: [
          /* @__PURE__ */ jsx2("span", { children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F..." }),
          /* @__PURE__ */ jsx2("span", { children: bytesTotal > 0 ? `\u0421\u043A\u0430\u0447\u0430\u043D\u043E ${(bytesLoaded / (1024 * 1024)).toFixed(1)} \u041C\u0411 \u0438\u0437 ${(bytesTotal / (1024 * 1024)).toFixed(1)} \u041C\u0411 (${percent}%)` : `${percent}%` })
        ] }),
        /* @__PURE__ */ jsx2("div", { className: "mzp-updater-progress-bar", children: /* @__PURE__ */ jsx2(
          "div",
          {
            className: "mzp-updater-progress-fill",
            style: { width: `${percent}%` }
          }
        ) })
      ] }),
      status === "installing" && /* @__PURE__ */ jsxs2("div", { className: "mzp-updater-status-row", children: [
        /* @__PURE__ */ jsx2("div", { className: "mzp-updater-spinner" }),
        /* @__PURE__ */ jsx2("span", { className: "mzp-updater-status-text", children: "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0438 \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u043A..." })
      ] }),
      status === "downloaded" && /* @__PURE__ */ jsxs2("div", { className: "mzp-updater-status-row mzp-updater-text-success", children: [
        /* @__PURE__ */ jsx2("span", { className: "mzp-updater-dot mzp-updater-dot-success" }),
        /* @__PURE__ */ jsx2("span", { children: bytesTotal > 0 ? `\u0421\u043A\u0430\u0447\u0430\u043D\u043E ${(bytesTotal / (1024 * 1024)).toFixed(1)} \u041C\u0411. \u0413\u043E\u0442\u043E\u0432\u043E \u043A \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0435.` : "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u043A\u0430\u0447\u0430\u043D\u043E. \u0413\u043E\u0442\u043E\u0432\u043E \u043A \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0435." })
      ] }),
      status === "error" && /* @__PURE__ */ jsxs2("div", { className: "mzp-updater-status-row mzp-updater-text-error", children: [
        /* @__PURE__ */ jsx2("span", { className: "mzp-updater-dot mzp-updater-dot-error" }),
        /* @__PURE__ */ jsxs2("span", { children: [
          "\u041E\u0448\u0438\u0431\u043A\u0430: ",
          error
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "mzp-updater-actions", children: [
      (status === "idle" || status === "up-to-date" || status === "error") && /* @__PURE__ */ jsx2(
        "button",
        {
          type: "button",
          className: "mzp-updater-btn mzp-updater-btn-secondary",
          onClick: check,
          children: "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F"
        }
      ),
      status === "checking" && /* @__PURE__ */ jsx2(
        "button",
        {
          type: "button",
          className: "mzp-updater-btn mzp-updater-btn-secondary",
          disabled: true,
          children: "\u041F\u0440\u043E\u0432\u0435\u0440\u044F\u044E..."
        }
      ),
      status === "available" && /* @__PURE__ */ jsxs2(Fragment, { children: [
        /* @__PURE__ */ jsxs2(
          "button",
          {
            type: "button",
            className: "mzp-updater-btn mzp-updater-btn-primary",
            onClick: download,
            children: [
              "\u0421\u043A\u0430\u0447\u0430\u0442\u044C v",
              targetVersion
            ]
          }
        ),
        notes && /* @__PURE__ */ jsx2(
          "button",
          {
            type: "button",
            className: "mzp-updater-btn mzp-updater-btn-ghost",
            onClick: () => setIsModalOpen(true),
            children: "\u0427\u0442\u043E \u043D\u043E\u0432\u043E\u0433\u043E?"
          }
        )
      ] }),
      status === "downloading" && /* @__PURE__ */ jsxs2(
        "button",
        {
          type: "button",
          className: "mzp-updater-btn mzp-updater-btn-secondary",
          disabled: true,
          children: [
            "\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 ",
            percent,
            "%"
          ]
        }
      ),
      status === "downloaded" && /* @__PURE__ */ jsxs2(Fragment, { children: [
        /* @__PURE__ */ jsx2(
          "button",
          {
            type: "button",
            className: "mzp-updater-btn mzp-updater-btn-accent",
            onClick: install,
            children: "\u041F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C"
          }
        ),
        notes && /* @__PURE__ */ jsx2(
          "button",
          {
            type: "button",
            className: "mzp-updater-btn mzp-updater-btn-ghost",
            onClick: () => setIsModalOpen(true),
            children: "\u0427\u0442\u043E \u043D\u043E\u0432\u043E\u0433\u043E?"
          }
        )
      ] }),
      status === "installing" && /* @__PURE__ */ jsx2(
        "button",
        {
          type: "button",
          className: "mzp-updater-btn mzp-updater-btn-secondary",
          disabled: true,
          children: "\u041F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u043A..."
        }
      )
    ] }),
    /* @__PURE__ */ jsx2(
      UpdateModal,
      {
        isOpen: isModalOpen,
        onClose: () => setIsModalOpen(false),
        version: targetVersion,
        notes
      }
    )
  ] });
};
export {
  UpdateCard,
  UpdateModal,
  useUpdater
};
