// Home page component for LegalPro v1.0.1
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Scale, 
  Shield, 
  Users, 
  Award, 
  ArrowRight, 
  Star,
  Calendar,
  MessageSquare,
  FileText,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { WhatsAppConsultationButton, WhatsAppChatButton } from '../components/whatsapp/WhatsAppButton';

const Home: React.FC = () => {
  const practiceAreas = [
    {
      icon: Users,
      title: 'Family Law',
      description: 'Divorce, custody, adoption, and family dispute resolution.',
      slug: 'family-law'
    },
    {
      icon: Scale,
      title: 'Corporate Law',
      description: 'Business formation, contracts, and commercial litigation.',
      slug: 'corporate-law'
    },
    {
      icon: Shield,
      title: 'Criminal Defense',
      description: 'Experienced criminal defense representation.',
      slug: 'criminal-defense'
    },
    {
      icon: FileText,
      title: 'Property Law',
      description: 'Real estate transactions, property disputes, and zoning.',
      slug: 'property-law'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Business Owner',
      content: 'LegalPro helped me navigate complex business regulations with ease. Their expertise saved my company time and money.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Individual Client',
      content: 'Professional, responsive, and results-driven. I couldn\'t have asked for better legal representation.',
      rating: 5
    },
    {
      name: 'Emma Wilson',
      role: 'Non-Profit Director',
      content: 'Their commitment to our case was exceptional. They fought for us every step of the way.',
      rating: 5
    }
  ];

  const stats = [
    { number: '500+', label: 'Cases Won' },
    { number: '15+', label: 'Years Experience' },
    { number: '1000+', label: 'Happy Clients' },
    { number: '95%', label: 'Success Rate' }
  ];

  return (
    <main className="min-h-screen" role="main">
      {/* Hero Section */}

      <section className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 text-white overflow-hidden" role="banner" aria-labelledby="hero-heading">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">

      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/20 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 id="hero-heading" className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Expert Legal Solutions for Your{' '}
                <span className="text-secondary-400 bg-gradient-to-r from-secondary-400 to-secondary-300 bg-clip-text text-transparent">Peace of Mind</span>
              </h1>
              <p className="text-xl text-primary-100 mb-8 leading-relaxed">
                Professional legal services with a personal touch. We're here to protect your rights and guide you through every legal challenge.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/appointments">
                  <Button size="lg" className="w-full sm:w-auto" aria-label="Book a legal consultation appointment">
                    <Calendar className="w-5 h-5 mr-2" aria-hidden="true" />
                    Book Consultation
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-navy-800" aria-label="Learn more about our legal services">
                    Learn More
                    <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-gold-400 to-gold-600 rounded-lg transform rotate-6"></div>
                <div className="relative bg-white rounded-lg p-8 text-navy-800 shadow-2xl">
                  <div className="flex items-center mb-4">
                    <Scale className="w-8 h-8 text-gold-500 mr-3" />
                    <h3 className="text-2xl font-bold">Free Consultation</h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Get expert legal advice tailored to your specific situation. No obligation, no hidden fees.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-gold-500 rounded-full mr-3"></div>
                      <span>30-minute consultation</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-gold-500 rounded-full mr-3"></div>
                      <span>Case evaluation</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-gold-500 rounded-full mr-3"></div>
                      <span>Strategic planning</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white" aria-labelledby="stats-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="stats-heading" className="sr-only">Our Track Record</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-navy-800 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Practice Areas */}
      <section className="py-20 bg-gray-50" aria-labelledby="practice-areas-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="practice-areas-heading" className="text-3xl md:text-4xl font-bold text-navy-800 mb-4">
              Our Practice Areas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We provide comprehensive legal services across multiple practice areas, ensuring expert representation for all your legal needs.
            </p>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" role="list">
            {practiceAreas.map((area, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  hover
                  clickable
                  className="p-6 h-full"
                  aria-label={`Learn more about ${area.title}`}
                  role="article"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                      <area.icon className="w-8 h-8 text-navy-800" />
                    </div>
                    <h3 className="text-xl font-semibold text-navy-800 mb-3">
                      {area.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {area.description}
                    </p>
                    <Link
                      to={`/practice-areas/${area.slug}`}
                      className="text-gold-600 hover:text-gold-700 font-medium inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded"
                      aria-label={`Learn more about ${area.title} legal services`}
                    >
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
                    </Link>
                  </div>
                </Card>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-800 mb-4">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600">
              Don't just take our word for it - hear from our satisfied clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-gold-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-navy-800">
                      {testimonial.name}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {testimonial.role}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-navy-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Contact us today for a free consultation and let us help you navigate your legal challenges with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/appointments">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule Consultation
                </Button>
              </Link>
              <WhatsAppConsultationButton
                size="lg"
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                message="Hi! I'm interested in scheduling a consultation. Can you help me get started?"
              />
              <Link to="/contact">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-navy-800">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-navy-800" />
              </div>
              <h3 className="text-lg font-semibold text-navy-800 mb-2">Visit Us</h3>
              <p className="text-gray-600">
                123 Legal Street, Suite 100<br />
                Nairobi, Kenya
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-navy-800" />
              </div>
              <h3 className="text-lg font-semibold text-navy-800 mb-2">Call Us</h3>
              <p className="text-gray-600">
                +254 700 123 456<br />
                Available 24/7
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-navy-800" />
              </div>
              <h3 className="text-lg font-semibold text-navy-800 mb-2">Email Us</h3>
              <p className="text-gray-600">
                info@legalpro.co.ke<br />
                Quick response guaranteed
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;