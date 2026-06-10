# Build For Need

An interactive, responsive full-stack platform where everyday individuals (**Problem Sharers**) share authentic real-world dilemmas, and (**Developers**) specially beginners propose open-source websites, widgets, repositories, or scripts to solve them.

# Main Purpose 
***New developers often only create to-do list, calculator and weather app projects. And when they go for interviews in companies, the companies are not impressed with all these projects they see. They want new ideas and interesting projects.***

***Sometimes a project can be very interesting and very brilliant, but it does not solve any real problem in the real world or reality. So this website is for them.***

***Here, some people will share their problems. And developers, especially beginners, will create tools, websites or softwares or any projects to solve their problems for free. Thus, they can help people and they themselves can create an interesting and new brilliant project that can solve real world problems. This will also help them to build strong portfolio in LinkedIn.***

## Main Developer 
https://github.com/boss-defender/Build_For_Need.git

## 🔗 Website Link
https://buildforneed.onrender.com/

## 🌟 Key Features

1. **Authentication & Identity System**: Flexible signup and login supporting both email and mobile selectors. Fully operational session validation.
2. **One-Time Direct Onboarding Page**: A beautiful onboarding card chooser presented uniquely to new users, prompting them to declare as a *Problem Sharer* or *Developer*.
3. **Dual-Role View Switcher**: Users hold both role preferences concurrently. A top toggle switch updates how they view the app's real-time feed in real-time.
4. **Anonymous Posting Controls**: Post creators can toggle anonymization ON to completely mask their identity as "Anonymous Problem Sharer" from non-author accounts.
5. **Post Visibility Levels**: Define post accessibility—either public to everyone or restricted solely to registered developer accounts.
6. **Robust Developer Suggestions**: Developers can bookmark/save preferred posts, and attach GitHub repository links with visibility toggles for private conversations with the post owner.
7. **Searchable FAQ Accordions**: Instantly filter platform questions with keywords.
8. **Purpose-Driven About Experience**: Highlights why code is most impactful when solved around active human dilemmas.

---

## Watch Demo 
https://drive.google.com/file/d/1FEZ0sqpJCRoUnQEhq2-GBsHy8VhjHPcD/view?usp=sharing

## 🛠️ Tech Stack & Architecture

- **Frontend**: Single Page Application built on **React 19**, **Vite 6**, and **TypeScript 5**.
- **Styling**: Modern, low-clutter system powered by **Tailwind CSS**.
- **Backend Service**: Custom **Express** server serving REST API utilities and proxying hot bundles.
- **Persistence Layer**: Local JSON file database storing users, posts, and comments.

---

## 🚀 Local Hosting & Execution Instructions

### 🖥️ Ubuntu Self-Hosting Guide
For detailed instructions on hosting Project From Problem from your local PC, sharing with friends on the same network, configuring database persistence, and setting up automatic startups via system services, please refer to:
👉 **[Ubuntu Self-Hosting Guide (UBUNTU_HOSTING_GUIDE.md)](./UBUNTU_HOSTING_GUIDE.md)**

---

### Running Locally (Quick Start)
To launch the development suite on your local compiler:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Dev Environment**:
   ```bash
   npm run dev
   ```
   This spins up the Express server on port `3000` executing Vite middlewares. Open `http://localhost:3000` to preview.

3. **Production Compilation**:
   ```bash
   npm run build
   ```
   Compiles static SPA assets and bundles the background script to `dist/server.cjs`.

4. **Production Start**:
   ```bash
   npm run start
   ```

---

## 🧪 Testing Credentials
The platform is seeded pre-loaded with sample data to simulate a bustling developer neighborhood:

- **Sarah Jenkins** (Problem Sharer): `sarah@gmail.com`
- **Alex Rivera** (Developer Enthusiast): `alex@dev.com`

