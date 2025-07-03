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
    <div className="min-h-screen">
      {/* Hero Section - Mobile-First Responsive */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/20 to-transparent"></div>
        <div className="relative container-mobile section-spacing">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <h1 className="heading-hero mb-4 sm:mb-6">
                Expert Legal Solutions for Your{' '}
                <span className="text-secondary-400">Peace of Mind</span>
              </h1>
              <p className="text-lg sm:text-xl text-primary-100 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Professional legal services with a personal touch. We're here to protect your rights and guide you through every legal challenge.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto lg:mx-0">
                <Link to="/appointments" className="flex-1 sm:flex-none">
                  <Button size="lg" fullWidth className="sm:w-auto">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Book Consultation
                  </Button>
                </Link>
                <Link to="/about" className="flex-1 sm:flex-none">
                  <Button variant="outline" size="lg" fullWidth className="sm:w-auto border-white text-white hover:bg-white hover:text-primary-800">
                    Learn More
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-8 lg:mt-0"
            >
              <div className="relative max-w-md mx-auto lg:max-w-none">
                <div className="absolute inset-0 bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-xl transform rotate-3 sm:rotate-6 opacity-90"></div>
                <div className="relative bg-white rounded-xl p-6 sm:p-8 text-primary-800 shadow-2xl">
                  <div className="flex items-center mb-4 sm:mb-6">
                    <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-500 mr-2 sm:mr-3" />
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold">Free Consultation</h3>
                  </div>
                  <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6 leading-relaxed">
                    Get expert legal advice tailored to your specific situation. No obligation, no hidden fees.
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-secondary-500 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                      <span className="text-sm sm:text-base">30-minute consultation</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-secondary-500 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                      <span className="text-sm sm:text-base">Case evaluation</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-secondary-500 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                      <span className="text-sm sm:text-base">Strategic planning</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section - Mobile-First Responsive */}
      <section className="section-spacing bg-white">
        <div className="container-mobile">
          <div className="grid-mobile-4">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-800 mb-1 sm:mb-2">
                  {stat.number}
                </div>
                <div className="text-sm sm:text-base text-neutral-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Practice Areas - Mobile-First Responsive */}
      <section className="section-spacing bg-neutral-50">
        <div className="container-mobile">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="heading-section text-primary-800 mb-3 sm:mb-4">
              Our Practice Areas
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              We provide comprehensive legal services across multiple practice areas, ensuring expert representation for all your legal needs.
            </p>
          </div>

          <div className="grid-mobile-4">
            {practiceAreas.map((area, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card hover clickable padding="md" className="h-full">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <area.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-800" />
                    </div>
                    <h3 className="heading-card text-primary-800 mb-2 sm:mb-3">
                      {area.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {area.description}
                    </p>
                    <Link 
                      to={`/practice-areas/${area.slug}`}
                      className="text-gold-600 hover:text-gold-700 font-medium inline-flex items-center"
                    >
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
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

      {/* CTA Section - Mobile-First Responsive */}
      <section className="section-spacing bg-primary-800 text-white">
        <div className="container-mobile">
          <div className="text-center">
            <h2 className="heading-section mb-4 sm:mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-primary-100 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
              Contact us today for a free consultation and let us help you navigate your legal challenges with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto sm:max-w-none">
              <Link to="/appointments" className="flex-1 sm:flex-none">
                <Button variant="secondary" size="lg" fullWidth className="sm:w-auto">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Schedule Consultation
                </Button>
              </Link>
              <WhatsAppConsultationButton
                size="lg"
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                message="Hi! I'm interested in scheduling a consultation. Can you help me get started?"
              />
              <Link to="/contact" className="flex-1 sm:flex-none">
                <Button variant="outline" size="lg" fullWidth className="sm:w-auto border-white text-white hover:bg-white hover:text-primary-800">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
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
    </div>
  );
};

export default Home;