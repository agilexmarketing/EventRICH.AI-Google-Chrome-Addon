# EventRICH.AI Chrome Extension - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Basic Features](#basic-features)
3. [Advanced Features](#advanced-features)
4. [Filtering and Search](#filtering-and-search)
5. [Data Export](#data-export)
6. [Analytics Dashboard](#analytics-dashboard)
7. [Debug Mode](#debug-mode)
8. [Settings and Preferences](#settings-and-preferences)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Troubleshooting](#troubleshooting)
11. [FAQ](#faq)

## Getting Started

### Installation
1. Install the EventRICH.AI extension from the Chrome Web Store
2. Pin the extension to your toolbar for easy access
3. Navigate to any website to start detecting tracking

### First Use
1. **Open a website** with tracking (e.g., an e-commerce site)
2. **Click the EventRICH.AI icon** in your browser toolbar
3. **View detected trackers** in the popup window
4. **Explore event details** by clicking on any tracker

## Basic Features

### Tracking Detection
The extension automatically detects these tracking services:
- **EventRICH.AI Pixel** - Our proprietary tracking solution
- **Google Analytics** - GA4 and Universal Analytics events
- **Meta/Facebook Pixel** - Facebook and Instagram tracking
- **TikTok Pixel** - TikTok advertising events
- **Google Ads** - Conversion tracking and remarketing
- **Google Tag Manager** - Container and tag analysis
- **Other Trackers** - Microsoft Ads, Pinterest, Snapchat, etc.

### Understanding the Interface

#### Header
- **EventRICH.AI Logo** - Click to visit our website
- **Theme Toggle** - Switch between Light, Dark, and System themes
- **Analytics Button** - Open the analytics dashboard
- **Export Button** - Export tracking data
- **Filters Button** - Toggle advanced filtering options

#### Status Bar
Shows current tracking status:
- **Loading** - Scanning for tracking events
- **Found tracking** - Displays the current website and event count
- **No tracking detected** - No events found on current page

#### Tracker List
Each detected tracker shows:
- **Tracker icon and name**
- **Event count badge**
- **iOS blocking warning** (for external trackers)
- **Expandable event details**

### Theme Switching
EventRICH.AI supports three theme modes:
- **Light Mode** - Traditional light interface
- **Dark Mode** - Dark interface for low-light environments
- **System Mode** - Automatically matches your system theme

To change themes:
1. Click the theme toggle in the header
2. Select your preferred mode
3. The setting is saved automatically

## Advanced Features

### User Accounts
Create an EventRICH.AI account for additional features:
1. Click **"Login to activate your credits"** at the bottom
2. Enter your email and password
3. Or click **"Sign up"** to create a new account

**Account Benefits:**
- Cloud sync across devices
- Extended data retention
- Premium export features
- Priority support
- Advanced analytics

### Real-time Monitoring
The extension continuously monitors tracking events:
- **Badge indicator** shows the number of active trackers
- **Automatic updates** when new events are detected
- **Performance metrics** track loading times and data transfer

### Historical Data
Events are stored locally for analysis:
- **Default retention** - 1000 events or 7 days
- **Configurable limits** in settings
- **Automatic cleanup** of old events
- **Export before cleanup** to preserve important data

## Filtering and Search

### Basic Search
1. Click the **"Filters"** button in the header
2. Enter search terms in the search box
3. Results update in real-time

**Search includes:**
- Event names
- URL parameters
- Parameter names and values
- Tracker names

### Advanced Filters

#### Tracker Filter
- Select specific tracking services
- Hide/show individual tracker types
- Focus on particular platforms

#### Event Name Filter
- Filter by specific event types
- Common events: page_view, purchase, add_to_cart
- Custom event names from your implementation

#### Date Range Filter
- Set start and end dates/times
- Focus on specific time periods
- Analyze tracking during particular campaigns

### Filter Management
- **Active filter indicator** - Blue dot shows when filters are active
- **Clear all filters** - Reset to show all events
- **Filter persistence** - Filters remain active until changed

## Data Export

### Export Formats

#### JSON Format
```json
{
  "name": "purchase",
  "parameters": [
    {
      "name": "event info",
      "items": [
        {"name": "Event Name", "value": "purchase"},
        {"name": "Currency", "value": "USD"}
      ]
    }
  ],
  "url": "https://example.com/track",
  "timestamp": "2024-12-18T10:30:00.000Z"
}
```

#### CSV Format
```csv
Event Name,URL,Timestamp,Parameters
purchase,https://example.com/track,2024-12-18T10:30:00.000Z,"{""event info"":[{""name"":""Currency"",""value"":""USD""}]}"
```

#### Text Format
```
Event: purchase
URL: https://example.com/track
Timestamp: 2024-12-18T10:30:00.000Z
Parameters:
  event info:
    Currency: USD
    Value: 29.99
```

### Export Process
1. **Select data** using filters if needed
2. **Click the Export button**
3. **Choose format** (JSON, CSV, or TXT)
4. **File downloads** automatically
5. **Open in your preferred tool** for analysis

### Export Tips
- **Filter first** to export only relevant data
- **Use timestamps** in filenames for organization
- **JSON format** best for developers
- **CSV format** best for Excel/Google Sheets
- **TXT format** best for human reading

## Analytics Dashboard

### Opening the Dashboard
Click the **Analytics** button (📊) in the header to open the full analytics dashboard.

### Dashboard Sections

#### Summary Cards
- **Total Events** - Count of all detected events
- **Active Trackers** - Number of different tracking services
- **Average Load Time** - Performance impact of tracking
- **Error Rate** - Percentage of failed tracking requests

#### Top Events
- **Most frequent events** on the current website
- **Event count** and percentage of total
- **Tracker attribution** for each event
- **Visual progress bars** for comparison

#### Performance Overview
- **Data transferred** by all tracking requests
- **Load time distribution** with color coding:
  - Green: Fast (< 1s)
  - Yellow: Moderate (1-3s)  
  - Red: Slow (> 3s)
- **Error rate tracking** with trend indicators

#### Activity Timeline
- **Chronological event list** with timestamps
- **Success/failure indicators** for each event
- **Tracker identification** for quick filtering
- **Real-time updates** as new events occur

### Time Range Selection
Change the analysis period:
- **Last Hour** - Recent activity focus
- **Last 24 Hours** - Daily tracking overview
- **Last 7 Days** - Weekly tracking trends

## Debug Mode

### Enabling Debug Mode
Debug mode is available to account holders:
1. **Login to your account**
2. **Enable debug mode** in settings
3. **Click the Debug button** (appears in bottom-right)

### Debug Panel Tabs

#### Events Tab
- **Complete event data** with all parameters
- **Raw request/response data** toggle
- **Copy individual events** to clipboard
- **Performance timing** for each event

#### Errors Tab
- **JavaScript errors** from tracking scripts
- **Network failures** and timeout errors
- **Parsing errors** from malformed data
- **Error context** and stack traces

#### Audit Tab
- **User action logging** for security
- **Extension activity** tracking
- **Performance measurements**
- **System diagnostic information**

### Debug Features
- **Export debug data** for support tickets
- **Error reproduction** steps
- **Performance profiling** information
- **Network request analysis**

## Settings and Preferences

### Theme Settings
- **Light/Dark/System** theme selection
- **Automatic switching** based on system preferences
- **Persistent across sessions**

### Data Management
- **Maximum stored events** (default: 1000)
- **Data retention period** (default: 7 days)
- **Automatic cleanup** configuration
- **Export before cleanup** options

### Privacy Settings
- **Data encryption** for sensitive information
- **Audit logging** enable/disable
- **Error reporting** preferences
- **Analytics sharing** opt-in/out

### Performance Settings
- **Rate limiting** for tracking requests
- **Request deduplication** enable/disable
- **Memory usage** optimization
- **Background processing** preferences

### Notification Settings
- **Success notifications** for exports and actions
- **Error notifications** for issues and failures
- **Warning notifications** for performance issues
- **Auto-close timing** configuration

## Keyboard Shortcuts

### Global Shortcuts
- **Ctrl+Shift+E** (Cmd+Shift+E on Mac) - Toggle extension popup
- **Ctrl+Shift+X** (Cmd+Shift+X on Mac) - Export current data

### Popup Shortcuts
- **Ctrl+F** (Cmd+F on Mac) - Focus search/filters
- **Escape** - Close filters and modals
- **Enter** - Apply filters
- **Tab** - Navigate between interface elements

### Customization
- **Enable/disable** shortcuts in settings
- **Modify key combinations** (coming in future versions)
- **Context-sensitive** shortcuts in different modes

## Troubleshooting

### Common Issues

#### No Events Detected
**Possible causes:**
- Website has no tracking implemented
- Tracking blocked by ad blockers
- Website using non-standard tracking methods

**Solutions:**
1. **Refresh the page** and wait a few seconds
2. **Disable ad blockers** temporarily
3. **Check if tracking exists** by viewing page source
4. **Try a different website** to verify extension works

#### Events Not Updating
**Possible causes:**
- Browser cache issues
- Extension needs restart
- Website using delayed loading

**Solutions:**
1. **Refresh the extension** by closing and reopening
2. **Clear browser cache** and reload page
3. **Wait longer** for delayed tracking to load
4. **Restart Chrome** if issues persist

#### Export Not Working
**Possible causes:**
- Browser download restrictions
- Insufficient permissions
- Large data sets causing timeouts

**Solutions:**
1. **Check download permissions** in Chrome settings
2. **Filter data** to reduce export size
3. **Try different export format**
4. **Clear browser data** and try again

#### Login Issues
**Possible causes:**
- Incorrect credentials
- Network connectivity issues
- Account suspension

**Solutions:**
1. **Verify email and password**
2. **Check internet connection**
3. **Reset password** if needed
4. **Contact support** for account issues

### Performance Issues

#### Slow Loading
- **Reduce stored events** in settings
- **Clear old data** regularly
- **Disable debug mode** if not needed
- **Close other browser tabs**

#### High Memory Usage
- **Lower event retention** limits
- **Enable automatic cleanup**
- **Restart extension** periodically
- **Update to latest version**

### Getting Help
1. **Check this user guide** for common solutions
2. **Visit our FAQ** at eventrich.ai/faq
3. **Search our documentation** at eventrich.ai/docs
4. **Contact support** at support@eventrich.ai
5. **Join our community** Discord for peer help

## FAQ

### General Questions

**Q: Is EventRICH.AI free to use?**
A: Yes! The core tracking detection and analysis features are completely free. Premium features like cloud sync require an account.

**Q: Does the extension slow down my browsing?**
A: No. The extension is designed to have minimal impact on page load times and browser performance.

**Q: Can I use this on websites I don't own?**
A: Yes! The extension analyzes tracking that's already public. It doesn't access private data or bypass security measures.

**Q: Is my data shared with third parties?**
A: No. All analysis happens locally on your device. We only collect data you explicitly choose to share through account features.

### Technical Questions

**Q: Which browsers are supported?**
A: Currently Chrome and Chromium-based browsers (Edge, Brave, Opera). Firefox support is planned.

**Q: Can I analyze mobile website tracking?**
A: Yes, when viewing mobile websites in your desktop browser. Native mobile app tracking analysis is not supported.

**Q: Does this work with single-page applications (SPAs)?**
A: Yes! The extension detects tracking events regardless of how the website is built.

**Q: Can I integrate this with my development workflow?**
A: Yes! The export features and debug mode are designed for developers. API integration is available for account holders.

### Privacy Questions

**Q: What data does the extension collect?**
A: The extension analyzes tracking requests made by websites you visit. See our Privacy Policy for complete details.

**Q: How long is data stored?**
A: Locally, data is stored according to your settings (default: 1000 events or 7 days). Account data follows our retention policies.

**Q: Can I delete my data?**
A: Yes! You can clear local data anytime in settings, and request account deletion through support.

**Q: Is this GDPR compliant?**
A: Yes. We're designed to comply with GDPR, CCPA, and other privacy regulations. Contact our DPO at dpo@eventrich.ai for questions.

---

For additional help, visit [eventrich.ai/support](https://eventrich.ai/support) or email us at support@eventrich.ai.




