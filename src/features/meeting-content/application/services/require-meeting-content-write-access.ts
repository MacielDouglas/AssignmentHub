import "server-only";

import { requireMeetingContentManage } from "./meeting-content-auth";

export const requireMeetingContentWriteAccess = requireMeetingContentManage;
