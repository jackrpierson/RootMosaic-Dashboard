# RootMosaic - Auto Repair Analytics Dashboard

An AI-powered dashboard for detecting mechanical misdiagnosis and technician inefficiency in auto repair shops.

## 🚀 Features

### Core Analytics
- **Misdiagnosis Detection**: AI-powered identification of potential misdiagnosis cases
- **Efficiency Analysis**: Technician performance and time deviation tracking
- **Systemic Issues**: Identification of problematic vehicles and repeat issues
- **Financial Impact**: Comprehensive loss calculation and ROI analysis

### Interactive Dashboard
- **Real-time Filters**: Filter by date range, technicians, vehicle makes, and complaint types
- **Performance Metrics**: Key performance indicators with trend analysis
- **Predictive Analytics**: Risk prediction and performance forecasting
- **Financial Calculator**: Investment ROI and break-even analysis

### Advanced Insights
- **Technician Performance**: Individual technician efficiency and risk profiles
- **Vehicle Analysis**: Problematic vehicle identification and patterns
- **Repeat Issue Detection**: Systemic problems requiring process improvements
- **AI Recommendations**: Actionable insights for shop improvement

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: VisActor (VChart)
- **Backend**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT for insights
- **Deployment**: Vercel

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd root_cause_engine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SHOP_ID=your_shop_id
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment on Vercel

### 1. Prepare Your Repository
Ensure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository
4. Select the repository containing your RootMosaic dashboard

### 3. Configure Environment Variables
In your Vercel project settings, add the following environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SHOP_ID`
- `OPENAI_API_KEY`

### 4. Deploy
1. Vercel will automatically detect it's a Next.js project
2. Click "Deploy"
3. Your dashboard will be live at `https://your-project.vercel.app`

## 📊 Data Setup

### 1. Supabase Database
Ensure your Supabase database has the `transformed_service_data` table with the following schema:
- `vin`, `service_date`, `invoice_total`, `labor_hours_billed`
- `make`, `model`, `year`, `complaint`, `technician`
- `efficiency_deviation`, `efficiency_loss`, `estimated_loss`
- `repeat_45d`, `complaint_similarity`, `cluster_id`
- `suspected_misdiagnosis`, `shop_id`

### 2. Data Processing
Run the data transformation script to populate the dashboard:
```bash
python build_transformed_service_data.py
```

## 🎯 Dashboard Sections

### Executive Summary
- Misdiagnosis Rate
- Efficiency Loss
- Total Estimated Loss
- Potential Savings

### Critical Alerts
- High-priority misdiagnosis detection
- Top misdiagnosed issues
- High loss jobs
- Repeat visit patterns

### Technician Analysis
- Individual performance metrics
- Efficiency deviation tracking
- Risk profiles
- Training recommendations

### Systemic Issues
- Problematic vehicle identification
- Repeat issue patterns
- Root cause analysis
- Actionable insights

### Financial Calculator
- Investment ROI analysis
- Break-even calculations
- Cost-benefit projections
- Implementation recommendations

### Predictive Analytics
- Risk prediction models
- Performance forecasting
- Trend analysis
- AI-powered recommendations

## 🔧 Customization

### Styling
The dashboard uses Tailwind CSS for styling. Customize colors and components in:
- `tailwind.config.js` - Theme configuration
- `app/globals.css` - Custom component styles

### Components
All dashboard components are located in the `components/` directory:
- `DashboardHeader.tsx` - Main header
- `MetricsGrid.tsx` - Key metrics display
- `FiltersPanel.tsx` - Interactive filters
- `AlertsSection.tsx` - Critical alerts
- `TechnicianAnalysis.tsx` - Technician performance
- `SystemicIssues.tsx` - Problem identification
- `FinancialCalculator.tsx` - ROI analysis
- `PredictiveAnalytics.tsx` - Risk prediction

### API Routes
API endpoints are in `app/api/`:
- `transformed-data/route.ts` - Data fetching from Supabase

## 📈 Performance Optimization

- **Server-side rendering** for better SEO and initial load
- **API route optimization** with proper caching
- **Component lazy loading** for better performance
- **Responsive design** for all device sizes

## 🔒 Security

- Environment variables for sensitive data
- Supabase Row Level Security (RLS)
- API route protection
- Input validation and sanitization

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact: jackpierson3511@gmail.com

---

**Built with ❤️ for auto repair shop owners** 