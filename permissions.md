# Goal

The sole purpose of ZalipOff is to help users stay focused while browsing. The extension identifies distracting
websites and blocks access to them during user-initiated focus sessions. Block-list settings and distraction prompts
support this same purpose.

# Chrome Web Store Permission Justifications

## `scripting`

ZalipOff uses the scripting permission only as a fallback to inject its
packaged focus-nudge content script into the active HTTP or HTTPS tab when the
statically declared content script is unavailable, for example in a tab that
was already open during installation or an extension update. It never
downloads or executes remote code.

## `storage`

ZalipOff stores focus sessions, user preferences, blocked and excluded site
rules, local site classifications, distraction counters, runtime state, and
cached URL decisions in `chrome.storage.local`. This data is needed to preserve
the user's configuration and focus state across tabs, service-worker restarts,
and browser restarts.

## `idle`

ZalipOff uses Chrome's idle state to pause distraction-time tracking while the
user is away from the device or the device is locked. This prevents inactive
time from being counted as browsing activity.

## `alarms`

ZalipOff uses a repeating Chrome alarm to wake its Manifest V3 service worker
once per minute and save locally accumulated distraction-time counters. This
is required because the service worker may be suspended between browser
events.

## Host permission

ZalipOff's single purpose is to help users stay focused by detecting and
blocking distracting pages during focus sessions. It requires access to all
HTTP and HTTPS sites so it can evaluate the current URL at document start,
display the focus overlay, track time on the active site, and apply user-defined
rules to any domain. The extension does not request access to file URLs or
browser-internal pages.

