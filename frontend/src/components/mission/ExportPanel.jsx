// src/components/mission/ExportPanel.jsx
import React, { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  FaFileExport,
  FaCloudUploadAlt,
  FaCloudDownloadAlt,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import {
  uploadMissionToDrone,
  downloadMissionFromDrone,
} from "../../api/droneApi";
import { toast } from "react-toastify";

const ExportPanel = ({
  onExport,
  disabled,
  missionItems,
  homePosition,
  setMissionItems,
}) => {
  const [format, setFormat] = useState("ArduPilot");
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal State for Upload/Read Animation
  const [syncState, setSyncState] = useState({
    isOpen: false,
    type: "upload", // 'upload' or 'download'
    status: "syncing", // 'syncing', 'success', 'error'
    progress: 0,
    total: 0,
    message: "",
  });

  const handleExportClick = () => {
    if (onExport) onExport(format);
  };

  const handleUploadToDrone = async () => {
    if (!missionItems || missionItems.length === 0) {
      toast.error("No mission generated to upload!");
      return;
    }

    setIsProcessing(true);
    setSyncState({
      isOpen: true,
      type: "upload",
      status: "syncing",
      progress: 0,
      total: missionItems.length + 1,
      message: "Initializing drone connection...",
    });

    const success = await uploadMissionToDrone(
      missionItems,
      homePosition,
      (current, total, msg) => {
        setSyncState((prev) => ({
          ...prev,
          progress: current,
          total,
          message: msg,
        }));
      },
    );

    if (success) {
      setSyncState((prev) => ({
        ...prev,
        status: "success",
        progress: prev.total,
        message: "Mission Successfully Uploaded!",
      }));
      // Close automatically after success
      setTimeout(
        () => setSyncState((prev) => ({ ...prev, isOpen: false })),
        2500,
      );
    } else {
      setSyncState((prev) => ({
        ...prev,
        status: "error",
        message: "Upload failed. Check drone connection and try again.",
      }));
    }
    setIsProcessing(false);
  };

  const handleDownloadFromDrone = async () => {
    setIsProcessing(true);
    setSyncState({
      isOpen: true,
      type: "download",
      status: "syncing",
      progress: 0,
      total: 100, // Placeholder until count is known
      message: "Connecting to drone...",
    });

    try {
      const downloadedItems = await downloadMissionFromDrone(
        (current, total, msg) => {
          setSyncState((prev) => ({
            ...prev,
            progress: current,
            total,
            message: msg,
          }));
        },
      );

      if (downloadedItems && downloadedItems.length > 0) {
        if (setMissionItems) setMissionItems(downloadedItems);
        setSyncState((prev) => ({
          ...prev,
          status: "success",
          progress: prev.total,
          message: "Mission Downloaded Successfully!",
        }));
        setTimeout(
          () => setSyncState((prev) => ({ ...prev, isOpen: false })),
          2500,
        );
      } else {
        setSyncState((prev) => ({
          ...prev,
          status: "error",
          message: "Drone has no mission saved (Count is 0).",
        }));
      }
    } catch (err) {
      setSyncState((prev) => ({
        ...prev,
        status: "error",
        message: "Failed to download mission from drone. Packet lost.",
      }));
    }

    setIsProcessing(false);
  };

  const closeModal = () => setSyncState((prev) => ({ ...prev, isOpen: false }));

  return (
    <div className="p-3 border-b border-gray-700 relative">
      <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
        <FaFileExport /> Pixhawk Drone Actions
      </h3>

      <div className="flex flex-col gap-2 text-xs">
        {/* ROW 1: Upload / Read */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleUploadToDrone}
            disabled={disabled || isProcessing}
            className="w-full py-2.5 flex flex-col items-center justify-center gap-1 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-600 shadow-md"
          >
            <FaCloudUploadAlt className="text-xl" />
            Upload
          </button>

          <button
            onClick={handleDownloadFromDrone}
            disabled={isProcessing}
            className="w-full py-2.5 flex flex-col items-center justify-center gap-1 text-xs font-bold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors disabled:bg-gray-600 shadow-md"
          >
            <FaCloudDownloadAlt className="text-xl" />
            Read
          </button>
        </div>

        {/* EXPORT TO PC SECTION */}
        <div className="grid grid-cols-3 items-center mt-3 border-t border-gray-700 pt-3">
          <label className="text-gray-400 col-span-1">Export To:</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="col-span-2 bg-gray-900 w-full p-1.5 rounded-md text-white outline-none border border-gray-600"
          >
            <option value="ArduPilot">Mission Planner (.waypoints)</option>
            <option value="KML">Google Earth (.kml)</option>
          </select>
        </div>

        <button
          onClick={handleExportClick}
          disabled={disabled}
          className="w-full mt-2 py-2 text-sm font-bold text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors disabled:bg-gray-600 shadow-md"
        >
          Save File to PC
        </button>
      </div>

      {/* --- SYNC ANIMATION MODAL POPUP --- */}
      <Transition appear show={syncState.isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[9999]" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-[#1e293b] border border-gray-600 p-6 text-center shadow-2xl transition-all">
                  {/* ICON ANIMATION AREA */}
                  <div className="flex justify-center mb-4">
                    {syncState.status === "syncing" && (
                      <FaSpinner className="text-6xl text-blue-500 animate-spin" />
                    )}
                    {syncState.status === "success" && (
                      <FaCheckCircle className="text-6xl text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                    )}
                    {syncState.status === "error" && (
                      <FaTimesCircle className="text-6xl text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                    )}
                  </div>

                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold text-white mb-2 uppercase tracking-wide"
                  >
                    {syncState.type === "upload"
                      ? "Uploading to Drone"
                      : "Reading from Drone"}
                  </Dialog.Title>

                  {/* PROGRESS BAR */}
                  <div className="w-full bg-gray-800 rounded-full h-3 mt-4 mb-2 overflow-hidden border border-gray-700">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ease-out ${
                        syncState.status === "error"
                          ? "bg-red-500"
                          : syncState.status === "success"
                            ? "bg-emerald-500"
                            : "bg-blue-500"
                      }`}
                      style={{
                        width: `${Math.max(5, syncState.total > 0 ? (syncState.progress / syncState.total) * 100 : 5)}%`,
                      }}
                    ></div>
                  </div>

                  {/* PROGRESS TEXT */}
                  <p className="text-sm text-gray-400 font-mono mt-2 min-h-[40px] flex items-center justify-center font-bold">
                    {syncState.message}
                  </p>

                  {/* CLOSE BUTTON (Only visible on error) */}
                  {syncState.status === "error" && (
                    <button
                      onClick={closeModal}
                      className="mt-6 px-6 py-2 bg-gray-600 text-white font-bold rounded hover:bg-gray-500 transition-colors"
                    >
                      Close
                    </button>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default ExportPanel;
