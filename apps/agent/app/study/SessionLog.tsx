"use client";

import { createContext, useContext } from "react";
import type { StudyEvent } from "@keystone-ui/agent-core";

type Log = (event: Omit<StudyEvent, "t">) => void;

/** Lets deep parts of a session (a tool row being expanded) add to its study log. A no-op outside the study. */
export const SessionLog = createContext<Log>(() => {});

export const useSessionLog = () => useContext(SessionLog);
