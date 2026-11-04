import type { SiteContent } from "@/types/content";
import { mediaAssets } from "./media";

/** Editorially adapted from the preserved original pages. No clinical or qualification claims. */
export const content: SiteContent = {
  settings: {
    name: "Musical Vibes Foundation",
    url: "https://www.musicalvibesfoundation.com",
    email: "meenumalik77@gmail.com",
    phone: "+1 (416) 832-6970",
    location: "Brampton, Ontario, Canada",
    mission: "Empowering lives through music, wellness, and community support.",
  },
  home: {
    featuredProgramSlugs: [
      "healing-through-music",
      "senior-engagement-activities",
      "meditation-and-yoga",
    ],
    featuredEventSlugs: [
      "diwali-celebrations-2025",
      "seniors-club-picnic-2025",
    ],
  },
  media: mediaAssets,
  programs: [
    {
      id: "program.healing-through-music",
      slug: "healing-through-music",
      number: "01",
      title: "Healing Through Music",
      category: "Music & expression",
      headline: "Find a little joy in every note.",
      description:
        "Shared music, self-expression, and moments of connection for seniors.",
      paragraphs: [
        "Music gives us a way to express what words sometimes cannot. Our music program brings people together around sound, relaxation, and the pleasure of a familiar song.",
        "The foundation’s approach centres on emotional wellbeing and connection. Get in touch to learn about current music activities and how to take part.",
      ],
      focus: [
        "Music and self-expression",
        "Relaxation through sound",
        "Connection through shared experiences",
      ],
      imageId: "song",
      imageContext: "Music at our Seniors Club · February 2025",
      theme: "rose",
    },
    {
      id: "program.meditation-and-yoga",
      slug: "meditation-and-yoga",
      number: "02",
      title: "Meditation and Yoga",
      category: "Mindful living",
      headline: "Make room for a calmer rhythm.",
      description:
        "Mindfulness, breathing, and gentle movement with seniors in mind.",
      paragraphs: [
        "A moment of stillness can create space in a busy day. Meditation and Yoga brings together mindful practices, breathing exercises, and gentle movement.",
        "The original program is designed with seniors’ abilities in mind. Contact the foundation to discuss current activities and the right way for you to participate.",
      ],
      focus: [
        "Mindfulness and breathing",
        "Gentle movement",
        "Everyday relaxation",
      ],
      imageId: "march",
      imageContext: "From our Seniors Club archive · March 2025",
      theme: "sage",
    },
    {
      id: "program.senior-engagement-activities",
      slug: "senior-engagement-activities",
      number: "03",
      title: "Senior Engagement Activities",
      category: "Community & belonging",
      headline: "Good company changes the day.",
      description:
        "Gatherings, celebrations, and shared experiences that help seniors feel connected.",
      paragraphs: [
        "Everyone deserves to feel seen and included. Our Senior Engagement Activities bring people together through social gatherings, celebrations, and shared experiences.",
        "The foundation recognises the loneliness and isolation seniors can face. Community is at the heart of this program: an invitation to connect, contribute, and enjoy time together.",
      ],
      focus: [
        "Social gatherings",
        "Community celebrations",
        "Meaningful shared experiences",
      ],
      imageId: "circle",
      imageContext: "Seniors Club gathering · January 2025",
      theme: "gold",
    },
    {
      id: "program.nutrition-and-health-guidance",
      slug: "nutrition-and-health-guidance",
      number: "04",
      title: "Nutrition and Health Guidance",
      category: "Everyday wellbeing",
      headline: "Care for the everyday.",
      description:
        "Practical conversations about food, lifestyle, and healthy everyday choices.",
      paragraphs: [
        "Small everyday choices are part of caring for ourselves. This program shares guidance around nutrition, meal planning, and healthy living.",
        "Contact the foundation to ask about the topics currently being covered. The program supports informed choices; individual medical or dietary needs should be discussed with your own healthcare professional.",
      ],
      focus: [
        "Healthy eating habits",
        "Meal planning",
        "Everyday lifestyle choices",
      ],
      imageId: "speaker",
      imageContext: "From our Seniors Meet archive · October 2025",
      theme: "ivory",
    },
    {
      id: "program.online-workshops-and-talks",
      slug: "online-workshops-and-talks",
      number: "05",
      title: "Online Workshops and Talks",
      category: "Learning & conversation",
      headline: "Keep curiosity close.",
      description:
        "Conversations and learning opportunities that reach beyond physical distance.",
      paragraphs: [
        "Connection need not end at the door. Our Online Workshops and Talks create opportunities for discussion and learning across physical distances.",
        "The original program explores topics relevant to seniors, including isolation, wellbeing, and ageing. Ask the foundation about current topics, access details, and upcoming availability.",
      ],
      focus: [
        "Interactive conversations",
        "Topics relevant to seniors",
        "Learning across distances",
      ],
      imageId: "conversation",
      imageContext: "A conversation at our Seniors Meet · December 2025",
      theme: "plum",
    },
    {
      id: "program.food-drives-for-the-needy",
      slug: "food-drives-for-the-needy",
      number: "06",
      title: "Food Drives for the Needy",
      category: "Compassion in action",
      headline: "A caring community gives back.",
      description:
        "Community-led food support rooted in the belief that no one should go hungry.",
      paragraphs: [
        "Giving back is part of the foundation’s purpose. Food Drives for the Needy brings community support to people facing food insecurity.",
        "Whether you would like to contribute or find out more, contact the foundation about current needs and ways to help. Please arrange any contributions with the team first.",
      ],
      focus: [
        "Community food support",
        "Compassionate outreach",
        "Practical ways to contribute",
      ],
      imageId: "picnic-table",
      imageContext: "Our community together · Summer picnic, August 2025",
      theme: "rose",
    },
  ],
  events: [
    {
      id: "event.seniors-club-christmas-2025",
      slug: "seniors-club-christmas-2025",
      title: "A celebration in good company",
      date: "2025-12-08",
      dateLabel: "December 8, 2025",
      status: "past",
      description:
        "A look back at the Seniors Club Christmas celebration, preserved in the foundation’s community archive.",
      imageId: "christmas",
      galleryIds: ["christmas"],
      sourceAlbum: "Seniors Club Christmas Celebration (Dec 8 2025)",
    },
    {
      id: "event.diwali-celebrations-2025",
      slug: "diwali-celebrations-2025",
      title: "Diwali, shared together",
      date: "2025-10-16",
      dateLabel: "October 16, 2025",
      status: "past",
      description:
        "Music and shared celebration, captured at the foundation’s Diwali gathering.",
      imageId: "diwali",
      galleryIds: ["diwali", "diwali-portrait"],
      sourceAlbum: "Diwali Celebrations (Oct 16 2025)",
    },
    {
      id: "event.seniors-club-picnic-2025",
      slug: "seniors-club-picnic-2025",
      title: "A little sunshine. A lot of connection.",
      date: "2025-08-21",
      dateLabel: "August 21, 2025",
      status: "past",
      location: "Chinguacousy Park, Brampton",
      description:
        "The Seniors Social Club came together for a summer picnic. These photographs preserve a moment of community outdoors.",
      imageId: "picnic",
      galleryIds: ["picnic", "picnic-table"],
      sourceAlbum: "Seniors Meet (Aug 21 2025)",
    },
  ],
  faqs: [
    {
      question: "What does Musical Vibes Foundation do?",
      answer:
        "We are a nonprofit based in Brampton, Ontario. Our programs bring together music, wellness, senior engagement, learning, and community food support.",
      category: "About us",
    },
    {
      question: "Who are the programs for?",
      answer:
        "Our work places seniors at its heart and extends to the wider community through music, wellness, and charitable initiatives. Contact us to discuss which activities may be right for you.",
      category: "Taking part",
    },
    {
      question: "How can I join a program?",
      answer:
        "Email meenumalik77@gmail.com or call +1 (416) 832-6970 to ask about current availability, schedules, and how to take part.",
      category: "Taking part",
    },
    {
      question: "Where is the foundation based?",
      answer:
        "Musical Vibes Foundation is based in Brampton, Ontario, Canada. Please contact us for the location of a particular program or gathering.",
      category: "About us",
    },
    {
      question: "Are there upcoming events I can attend?",
      answer:
        "There are no confirmed upcoming events listed on this website at present. Contact the foundation for current information. The events archive shows past gatherings only.",
      category: "Taking part",
    },
    {
      question: "How can I volunteer or support an initiative?",
      answer:
        "Contact the foundation to discuss volunteering, collaboration, or supporting a food drive. The team can explain current needs and the next steps.",
      category: "Supporting us",
    },
    {
      question: "Can I make a donation through this website?",
      answer:
        "Online donations are not enabled on this website. Please contact the foundation directly to discuss ways to support its work.",
      category: "Supporting us",
    },
  ],
};
