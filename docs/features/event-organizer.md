## 1. Overview

The **Event Organizer** system allows moderators to create and manage event posts directly within Discord. Members can sign up or update their status using buttons and a simple pop-up modal to add optional notes - no slash commands required for participants.

### Key Objectives:
* **Seamless UX**: Two-step creation workflow (Modal -> Select Menus -> Embed Publish) and zero-slash command interaction for participants.
* **Clarity**: Clear metadata, native Discord relative timestamps, and capacity tracking.
* **Smart Auto-Management**: Automatic queue promotion/demotion based on capacity (FIFO/LIFO).
* **Security & Permissions**: Access control (required roles, co-organizers, bot owners).

---

## 2. Data Model (`mysql2`)

The system relies on two MySQL tables managed via `mysql2` using prepared statements.

### Table `events`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT` | Unique identifier (PK) |
| `message_id` | `VARCHAR(32)` | Discord message ID containing the embed |
| `channel_id` | `VARCHAR(32)` | Text channel ID |
| `guild_id` | `VARCHAR(32)` | Discord guild/server ID |
| `organizer_id` | `VARCHAR(32)` | Discord ID of the event creator |
| `co_organizer_ids` | `JSON` | Array of Discord IDs for co-organizers |
| `title` | `VARCHAR(255)` | Event title |
| `description` | `TEXT` | Additional details (optional) |
| `event_date` | `DATETIME` | Event start date and time |
| `min_players` | `INT` | Minimum required players (`default: 0`) |
| `max_players` | `INT` | Maximum player capacity (`NULL` if unlimited) |
| `allow_latecomers` | `BOOLEAN` | Allow late arrivals (`default: true`) |
| `allowed_role_ids` | `JSON` | Array of required role IDs (`NULL` if open to all) |
| `status` | `ENUM` | Event state: `'ACTIVE'`, `'CLOSED'`, `'CANCELLED'` |
| `created_at` | `TIMESTAMP` | Creation timestamp |

### Table `event_participants`
| Column | Type | Description |
| :--- | :--- | :--- |
| `event_id` | `INT` | FK -> `events(id)` (`ON DELETE CASCADE`) |
| `user_id` | `VARCHAR(32)` | Participant's Discord ID |
| `status` | `ENUM` | Status: `'PRESENT'`, `'MAYBE'`, `'ABSENT'`, `'WAITING_LIST'` |
| `note` | `VARCHAR(255)` | Optional note (e.g., *"Arriving around 9:15 PM"*) |
| `joined_at` | `DATETIME` | Sign-up timestamp (used for FIFO/LIFO rules) |
| `updated_at` | `TIMESTAMP` | Last update timestamp |

---

## 3. Workflow & UX (User Interface)

### A. Creation Process (`/event create`)
1. **Step 1: Modal Submission**
   * Command restricted to Moderators (Sapphire preconditions).
   * Running `/event create` opens a Modal with essential input fields:
     * **Event Title** *(e.g., 🎮 Sea of Thieves — Galleon Session)*
     * **Date & Time** *(format `DD/MM/YYYY HH:mm`)*
     * **Description** *(Optional)*
     * **Min / Max Players** *(Optional, e.g., `4/8` or `4`)*
   * Submitting inserts an initial record into `events` with status `PENDING` and returns a temporary `id`.

2. **Step 2: Interactive Role & Co-organizer Setup (Ephemeral)**
   * An ephemeral message is displayed containing Discord native Select Menus:
     * **`RoleSelectMenuBuilder`**: Select allowed roles (0 to 10).
     * **`UserSelectMenuBuilder`**: Select co-organizers (0 to 10).
     * **Publish Button**: Confirms settings, updates DB (`allowed_role_ids`, `co_organizer_ids`), builds the embed, and posts it to the channel.

---

### B. Discord Embed Structure

#### Dynamic Color Scheme:
* 🩶 **Grey** (`0x808080`): Sign-ups open, `min_players` not yet reached.
* 🟢 **Green** (`0x57F287`): `min_players` threshold reached, event confirmed!
* 🟡 **Gold** (`0xFEE75C`): Event almost full (1 or 2 spots remaining).
* 🟣 **Dark Purple** (`0x58148C`): Event **Full** (`max_players` reached, waitlist active).
* 🔴 **Red** (`0xED4245`): Event **Cancelled**.

#### Players Capacity Display Logic:
* **No Min & No Max**: `No Min/Max`
* **Min & Max**: `X / Y` (e.g., `4 / 8`)
* **Min only**: `X minimum` (e.g., `4 minimum`)

#### Field Visibility Rules:
* **Description**: Displayed only if provided.
* **Co-organizers**: Field added only if `co_organizer_ids` contains at least 1 user.
* **Allowed Roles**: Field added only if `allowed_role_ids` contains at least 1 role.

#### Footer Format:
`Organized by Organizer • updated on DD/MM à HH:mm` *(Single string without automatic Discord timestamp dot).*

#### Layout Preview:
```text
┌──────────────────────────────────────────────────────────────────┐
│ 📄 Title: 🎮 Sea of Thieves — Galleon Session                   │
├──────────────────────────────────────────────────────────────────┤
│ 📝 Description:                                                  │
│ Fun session raiding fortresses and looking for gold!             │
│                                                                  │
│ 📌 Information:                                                  │
│ • 📅 Date & Time: Monday 15/09 at 9:00 PM (<t:1726426800:R>)     │
│ • 👥 Players Min/Max: 4 / 8                                      │
│ • 🚪 Late Arrivals: Allowed 🟢                                  │
│                                                                  │
│ 🤝 Co-organizers: @CoOrg1                                        │
│ 🔒 Required Roles: @Pirate                                       │
│ ──────────────────────────────────────────────────────────────── │
│                                                                  │
│ 🟢 Present (3):                                                  │
│ • @Player0 — "Arriving around 9:15 PM"                           │
│ • @Player1                                                       │
│ • @Player2                                                       │
│                                                                  │
│ 🟡 Incertain (1):                                                │
│ • @Player3 — "Depending on work finish time"                     │
│                                                                  │
│ 🔴 Absent (1):                                                   │
│ • @Player4                                                       │
│                                                                  │
│ ⏳ Waitlist (0):                                                 │
│ • None                                                           │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ Organized by @Organizer • updated on 10/09 à 14:12               │
└──────────────────────────────────────────────────────────────────┘
 [ 🟢 Present ]   [ 🟡 Unsure ]   [ 🔴 Absent ]   [ ⚙️ Gérer ]
```
<br>

## 4. Business Rules & Logic

### A. Participant Interactions
* Role Checking: If ``allowed_role_ids`` is specified, the bot checks if the user has at least one required role. If not -> Ephemeral error message.
* Button Clicks:
  * Clicking ``🟢 Present``, ``🟡 Unsure``, or `🔴 Absent` -> Opens an ephemeral Modal pre-filled with the member's existing note (if any).
  * Submitting the Modal -> ``UPSERT`` into ``event_participants`` + updates the Embed.
* No Sign-up Removal: Selecting ``🔴 Absent`` acts as an explicit read-receipt ("I cannot make it"). Users cannot completely remove their entry from the event.

### B. Waitlist Management (``max_players``)
1. Saturation: When ``max_players`` capacity for ``🟢 Present`` is reached, any new ``🟢 Present`` registration is automatically assigned the ``'WAITING_LIST'`` status.
2. FIFO Promotion (First-In, First-Out):
   * If an attending player changes status to ``🔴 Absent`` or if ``max_players`` is increased:
   * The oldest member in ``'WAITING_LIST'`` is promoted to ``🟢 Present``.
   * A DM/ephemeral message is sent to notify them.
3. LIFO Demotion (Last-In, First-Out):
   * If ``max_players`` is decreased (e.g., reduced from 8 to 6 spots when 8 were attending):
   * The 2 most recent attendees in ``🟢 Present`` are demoted back to ``'WAITING_LIST'``.
   * A DM/ephemeral message is sent to notify them.

### C. Management Permissions (``⚙️ Gérer``)
Only the following entities can access the management menu:
* Event Organizer (``organizer_id``).
* Co-organizers listed in ``co_organizer_ids``.
* Bot Owners.

Available Management Actions:
1. Edit Details: Opens the full Modal pre-filled with current DB data.
2. Manage Player: Manually add or remove a member (sends a DM notification to the targeted user).
3. Close Event: Locks/disables interaction buttons.
4. Cancel Event: Changes embed color to Red ``[CANCELLED]``, disables buttons, and alerts participants.

---

## 5. Automated Maintenance (Cleanup Job)

A ``setInterval`` started natively on bot ready handles cleanup every 24 hours at 6:00 AM:

```sql
-- Automatically purge events older than 24 hours
DELETE FROM events WHERE event_date < NOW() - INTERVAL 1 DAY;
```

_(Thanks to ``ON DELETE CASCADE``, all linked rows in ``event_participants`` are deleted automatically)._


<sup><sup>10/09/2026</sup></sup>