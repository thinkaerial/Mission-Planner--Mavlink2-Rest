// src/components/mission/GenerationModal.jsx
import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { FaPlaneDeparture, FaPlane, FaHome } from "react-icons/fa";

const GenerationModal = ({
  isOpen,
  onClose,
  onConfirm,
  defaultAltitude, // Current default from sidebar
}) => {
  const [settings, setSettings] = useState({
    takeoffAlt: 20,
    surveyAlt: defaultAltitude || 50,
    rtlAlt: 30,
  });

  // Update survey alt if default changes externally
  useEffect(() => {
    setSettings((prev) => ({ ...prev, surveyAlt: defaultAltitude }));
  }, [defaultAltitude]);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleSubmit = () => {
    onConfirm(settings);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#1e293b] border border-gray-600 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-xl font-bold leading-6 text-white mb-4 border-b border-gray-600 pb-2"
                >
                  Mission Generation Settings
                </Dialog.Title>

                <div className="flex flex-col gap-4">
                  {/* Takeoff Altitude */}
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                      <FaPlaneDeparture className="text-blue-400" />
                      Takeoff Altitude (m)
                    </label>
                    <input
                      type="number"
                      value={settings.takeoffAlt}
                      onChange={(e) =>
                        handleChange("takeoffAlt", e.target.value)
                      }
                      className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-white outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Height for Command 22 (Takeoff).
                    </p>
                  </div>

                  {/* Survey Altitude */}
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                      <FaPlane className="text-green-400" />
                      Survey / Grid Altitude (m)
                    </label>
                    <input
                      type="number"
                      value={settings.surveyAlt}
                      onChange={(e) =>
                        handleChange("surveyAlt", e.target.value)
                      }
                      className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-white outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Height for photo mapping waypoints.
                    </p>
                  </div>

                  {/* RTL / Return Altitude */}
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                      <FaHome className="text-orange-400" />
                      Return Safety Altitude (m)
                    </label>
                    <input
                      type="number"
                      value={settings.rtlAlt}
                      onChange={(e) => handleChange("rtlAlt", e.target.value)}
                      className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-white outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Adds a waypoint at this height before RTL.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
                    onClick={handleSubmit}
                  >
                    Generate Mission
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default GenerationModal;
