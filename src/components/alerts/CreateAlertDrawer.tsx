"use client";

import React from "react";
import { EditSideDrawer } from "@/components/layout/EditSideDrawer";
import { AlertForm } from "./AlertForm";
import type { AlertFormData } from "@/components/forms/validations/alert.schema";
import type { AlertFilters } from "@/services/alerts.service";

interface CreateAlertDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AlertFormData) => Promise<void>;
  defaultFilters?: AlertFilters;
  /** Title shown in the drawer header. */
  title?: string;
}

export function CreateAlertDrawer({
  open,
  onClose,
  onSubmit,
  defaultFilters,
  title = "Creează alertă",
}: CreateAlertDrawerProps) {
  return (
    <EditSideDrawer open={open} onClose={onClose} title={title}>
      <AlertForm
        defaultValues={defaultFilters}
        onSubmit={onSubmit}
        submitLabel="Creează alerta"
        onCancel={onClose}
      />
    </EditSideDrawer>
  );
}
