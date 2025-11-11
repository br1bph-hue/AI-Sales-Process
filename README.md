# AI-Enabled Sales Process Framework

This repository contains two comprehensive tools for AI sales transformation:

## 1. AI-Enabled Sales Process Visualization
**File:** `ai-sales-process-visual.html`

An interactive visualization of the SEAM Framework (Structure, Enable, Accelerate, Measure) with:
- 10 core sales disciplines in a circular diagram
- 4-phase implementation roadmap
- Comparison of manual vs. AI-enabled processes
- ROI snapshots and key benefits

**To use:** Open the file in any modern web browser.

## 2. AI Readiness Assessment & Strategic Roadmap
**File:** `ai-readiness-assessment.html`

A complete assessment tool with interactive guided tour featuring:

### Key Features

#### 🎯 Assessment Section
- Evaluate across 4 dimensions: Data Infrastructure, Technology, Organization, and Process
- 8 questions with scoring system
- Real-time readiness score calculation

#### 📊 Readiness Score Dashboard
- Overall AI readiness score (0-100)
- Breakdown by category
- Visual score display

#### 🗺️ Strategic Roadmap
- 3-phase implementation plan (Pilot, Expand, Scale)
- 9 initiative cards with investment and payback details
- Click to toggle initiatives on/off
- Timeline and ROI projections

#### 💻 Technology Selection Manager
- Toggle 6 different AI technology categories
- Real-time scenario planning
- Dynamic investment and ROI calculations
- Simulate different technology combinations

#### 📋 Executive Summary
- Total investment, annual benefits, and ROI
- Strategic recommendations
- Export to PDF or copy to clipboard

#### 📈 KPIs Dashboard
- 8 key performance indicators
- Progress bars and trend indicators
- Quarterly target setting

### Guided Tour

The application includes an interactive tour powered by [Shepherd.js](https://shepherdjs.dev/) with 7 steps:

1. **Assessment** - Introduction to the readiness assessment
2. **Score** - Understanding your readiness score
3. **Roadmap** - Exploring the strategic phases
4. **Initiatives** - Drilling into specific initiatives
5. **Technologies** - Customizing your roadmap
6. **Summary** - Reviewing executive summary
7. **KPIs** - Monitoring success metrics

#### Starting the Tour

- **Automatic:** First-time visitors will be prompted to start the tour
- **Manual:** Click the "🎓 Start Guided Tour" button in the header at any time

The tour uses local storage to remember if you've completed it before.

### Technology Stack

- Pure HTML, CSS, and JavaScript (no build process required)
- Shepherd.js v11.2.0 (loaded via CDN)
- Responsive design for mobile and desktop
- Modern gradient styling with smooth animations

### Customization

#### Modify Assessment Questions
Edit the HTML in the `#assessment` section (lines ~150-240) to add or modify questions.

#### Update Initiative Cards
Modify the `.initiative-card` elements within each `.phase` (lines ~290-420) to change investments, payback periods, or descriptions.

#### Adjust KPI Metrics
Edit the `.kpi-card` elements in the `#kpis` section (lines ~720-850) to customize metrics and targets.

#### Customize Tour Steps
Modify the `startTour()` function (lines ~950-1100) to add, remove, or change tour steps.

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Usage Tips

1. **Complete the Assessment First** - This provides context for the rest of the tool
2. **Experiment with Scenarios** - Toggle technologies and initiatives to see different investment models
3. **Share with Leadership** - Use the export features to create executive summaries
4. **Set Realistic Targets** - Configure KPI targets based on your baseline metrics
5. **Revisit Regularly** - Update your assessment as your organization evolves

## Future Enhancements

Potential additions:
- Backend integration for data persistence
- Team collaboration features
- Industry benchmarking data
- PDF generation with custom branding
- Integration with CRM systems
- Advanced analytics and reporting

## License

Internal use only - proprietary framework based on SEAM methodology.

## Support

For questions or customization requests, contact your AI transformation team.
