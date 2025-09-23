# 🚀 Ultimate One-Click Setup Guide

## For Complete Beginners - No Coding Required!

This guide will get you from zero to a live AI trading dashboard in **under 5 minutes**.

---

## 🎯 Step 1: Get Your API Keys (2 minutes)

### Get Bitte AI Key
1. Go to [bitte.ai](https://bitte.ai)
2. Sign up (free account)
3. Go to Dashboard → API Keys
4. Create new key, copy it

### Get NEAR Wallet
1. Go to [wallet.near.org](https://wallet.near.org)
2. Create wallet (follow the prompts)
3. Your account ID will be something like `yourname.near`
4. Go to Settings → Security & Recovery → Export Private Key
5. Copy the private key (keep it secret!)
6. **Send some NEAR to your wallet** for gas fees ($5-10 is plenty)

### Generate Secret
1. Go to [random.org/strings](https://www.random.org/strings/)
2. Generate 1 string, 32 characters, letters+numbers
3. Copy the random string

---

## 🎯 Step 2: Deploy (30 seconds)

1. **Click this magic button:**

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fcrypto-dashboard&env=BITTE_API_KEY,ACCOUNT_ID,NEAR_PK,CRON_SECRET&envDescription=Required%20environment%20variables%20for%20the%20trading%20dashboard&envLink=https%3A%2F%2Fgithub.com%2Fyour-username%2Fcrypto-dashboard%23environment-setup&project-name=crypto-trading-dashboard&integration-ids=oac_V3R1GIpkoJorr6fqyiwdhl17)

2. **Fill in the 4 fields:**
   - `BITTE_API_KEY`: Your Bitte AI key
   - `ACCOUNT_ID`: Your NEAR account ID (yourname.near)
   - `NEAR_PK`: Your NEAR private key
   - `CRON_SECRET`: Your random string

3. **Click Deploy**

**That's it!** The database is automatically created for you.

---

## 🎯 Step 3: Watch It Work (2 minutes)

1. Wait for deployment to finish
2. Click "Visit" to see your dashboard
3. Trading will start automatically within 5 minutes
4. Watch your portfolio in real-time!

---

## ✨ What Happens Automatically

- ✅ **Database Created**: Neon PostgreSQL database provisioned
- ✅ **Tables Setup**: Trading tables created automatically  
- ✅ **Cron Job**: AI trading every 5 minutes
- ✅ **Security**: All endpoints protected
- ✅ **Monitoring**: Full trade history and analytics

---

## 🎉 You're Done!

Your AI trading bot is now live and making autonomous trading decisions every 5 minutes!

**Your dashboard URL**: `https://your-project-name.vercel.app`

### What to Expect
- **First Trade**: Within 5 minutes of deployment
- **Dashboard Updates**: Real-time portfolio tracking
- **AI Decisions**: Smart buy/sell decisions based on market analysis
- **Performance**: Full P&L tracking and analytics

---

## 🆘 Need Help?

**Not working?** Check these common issues:

1. **NEAR Balance**: Make sure your NEAR wallet has funds ($5+ recommended)
2. **Private Key**: Make sure you copied the full private key from NEAR wallet
3. **API Keys**: Verify your Bitte AI key is active
4. **Wait Time**: First trade happens within 5 minutes, be patient!

**Still stuck?** 
- Check Vercel dashboard for deployment logs
- Contact support with your error messages

---

## 🔒 Security Notes

- Your private key is encrypted in Vercel's secure environment
- Only you have access to your trading bot
- All API endpoints are protected by your secret key
- Database is isolated to your deployment

**You're in complete control!** 🎯
