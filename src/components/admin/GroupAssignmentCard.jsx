import {memo, useState} from "react";
import {Button} from "../ui/button.jsx";
import {Label} from "../ui/label.jsx";
import {Select} from "../ui/select.jsx";
import {Text} from "lucide-react";

const normalizeEmail = (email) => (email ? email.trim().toLowerCase() : "");

const EmptyState = ({title, description}) => (
  <div className="rounded-3xl border border-muted/40 bg-muted/5 px-4 py-6 text-center">
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
  </div>
);

const SectionCard = ({title, children}) => (
  <div className="rounded-3xl border border-muted/30 bg-background/70 p-4 shadow-soft">
    <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {title}
    </h4>
    <div className="mt-3 space-y-3">{children}</div>
  </div>
);

const Chip = ({label, onRemove, tone = "default"}) => {
  const toneClasses =
    tone === "critical"
      ? "border-destructive/50 text-destructive"
      : "border-primary/40 text-primary";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-semibold ${toneClasses}`}
    >
      {label}
      {onRemove ? (
        <button
          type="button"
          className="text-[10px] uppercase tracking-[0.16em]"
          onClick={onRemove}
        >
          Remove
        </button>
      ) : null}
    </span>
  );
};

const GroupAssignmentCard = ({
  groups,
  selectedGroupId,
  onSelectGroup,
  onAddAdmin,
  onRemoveAdmin,
  onAddMember,
  onRemoveMember,
  adminOptions,
  memberOptions,
}) => {
  if (!groups.length) {
    return (
      <EmptyState
        title="No groups found"
        description="Super admins can create a group from the left panel to begin assigning people."
      />
    );
  }

  const selectedGroup =
    groups.find((group) => group.id === selectedGroupId) ?? groups[0];
  const canManage = selectedGroup?.canManage ?? false;
  const groupAdmins = selectedGroup?.admins ?? [];
  const groupMembers = selectedGroup?.members ?? [];

  const filteredAdminOptions = adminOptions.filter(
    (option) =>
      !groupAdmins.map(normalizeEmail).includes(normalizeEmail(option.email))
  );
  const filteredMemberOptions = memberOptions.filter(
    (option) =>
      !groupMembers.map(normalizeEmail).includes(normalizeEmail(option.email))
  );
  const [adminInput, setAdminInput] = useState("");
  const [memberInput, setMemberInput] = useState("");

  return (
    <div className="rounded-4xl border border-muted/20 bg-background/90 p-6 shadow-soft card-aurora">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Manage assignments
          </h3>
          <p className="text-xs text-muted-foreground">
            Pick a group to review current admins and members. Promote or remove
            directly from this panel.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Label htmlFor="assignmentGroup" className="sr-only">
            Group
          </Label>
          <Select
            id="assignmentGroup"
            value={selectedGroup?.id ?? ""}
            onChange={(event) => onSelectGroup(event.target.value)}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
                {!group.canManage ? " — view only" : ""}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {!selectedGroup ? (
        <EmptyState
          title="No accessible groups"
          description="You do not have management rights for the selected group."
        />
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <SectionCard title="Group admins">
            {groupAdmins.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No admins assigned.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {groupAdmins.map((email) => (
                  <Chip
                    key={`admin-${email}`}
                    label={email}
                    onRemove={
                      canManage
                        ? () => onRemoveAdmin(selectedGroup.id, email)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}

            <div className="rounded-3xl border border-muted/30 bg-background/80 p-3">
              <Label
                htmlFor="assignAdmin"
                className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
              >
                Add admin
              </Label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Text
                  id="assignAdmin"
                  value={adminInput}
                  onChange={(event) => setAdminInput(event.target.value)}
                  list="admin-email-suggestions"
                  placeholder={canManage ? "Enter email" : "View only"}
                  disabled={!canManage}
                />
                <Button
                  type="button"
                  disabled={!canManage || !adminInput.trim()}
                  onClick={() => {
                    const value = adminInput.trim();
                    if (!value) return;
                    onAddAdmin(selectedGroup.id, value);
                    setAdminInput("");
                  }}
                >
                  Add
                </Button>
              </div>
              <datalist id="admin-email-suggestions">
                {filteredAdminOptions.map((option) => (
                  <option
                    key={`admin-option-${option.email}`}
                    value={option.email}
                  >
                    {option.label}
                  </option>
                ))}
              </datalist>
            </div>
          </SectionCard>

          <SectionCard title="Group members">
            {groupMembers.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No members assigned.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {groupMembers.map((email) => (
                  <Chip
                    key={`member-${email}`}
                    label={email}
                    onRemove={
                      canManage
                        ? () => onRemoveMember(selectedGroup.id, email)
                        : undefined
                    }
                    tone={canManage ? "default" : "critical"}
                  />
                ))}
              </div>
            )}

            <div className="rounded-3xl border border-muted/30 bg-background/80 p-3">
              <Label
                htmlFor="assignMember"
                className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
              >
                Add member
              </Label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Text
                  id="assignMember"
                  value={memberInput}
                  onChange={(event) => setMemberInput(event.target.value)}
                  list="member-email-suggestions"
                  placeholder={canManage ? "Enter email" : "View only"}
                  disabled={!canManage}
                />
                <Button
                  type="button"
                  disabled={!canManage || !memberInput.trim()}
                  onClick={() => {
                    const value = memberInput.trim();
                    if (!value) return;
                    onAddMember(selectedGroup.id, value);
                    setMemberInput("");
                  }}
                >
                  Add
                </Button>
              </div>
              <datalist id="member-email-suggestions">
                {filteredMemberOptions.map((option) => (
                  <option
                    key={`member-option-${option.email}`}
                    value={option.email}
                  >
                    {option.label}
                  </option>
                ))}
              </datalist>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
};

export default memo(GroupAssignmentCard);
