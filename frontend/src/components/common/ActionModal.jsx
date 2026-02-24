// src/components/common/ActionModal.jsx
import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

const ActionModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "OK",
  cancelText = "Cancel",
  requiresInput = false,
  inputLabel = "",
  defaultValue = "",
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    onConfirm(requiresInput ? inputValue : true);
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
          <div className="fixed inset-0 bg-black bg-opacity-60" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#2d3748] p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-100"
                >
                  {title}
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-400">{description}</p>
                </div>

                {requiresInput && (
                  <div className="mt-4">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full bg-gray-900 border border-blue-400 rounded-md p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={inputLabel}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleConfirm();
                      }}
                    />
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-4">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-full border border-transparent bg-gray-600 px-6 py-2 text-sm font-medium text-gray-100 hover:bg-gray-700 focus:outline-none"
                    onClick={onClose}
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-full border border-transparent bg-blue-500 px-6 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none"
                    onClick={handleConfirm}
                  >
                    {confirmText}
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

export default ActionModal;
