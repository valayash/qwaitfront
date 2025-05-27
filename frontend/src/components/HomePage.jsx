import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
        <header className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold">QWait</span>
            </div>
            <nav className="hidden md:flex space-x-10">
              <a href="#features" className="hover:text-blue-200">Features</a>
              <a href="#how-it-works" className="hover:text-blue-200">How It Works</a>
              <a href="#pricing" className="hover:text-blue-200">Pricing</a>
              <a href="#contact" className="hover:text-blue-200">Contact</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="px-4 py-2 rounded hover:bg-blue-800 transition duration-300">Log In</Link>
              <Link to="/register" className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded transition duration-300">Sign Up</Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">Simplify Your Restaurant Waitlist Management</h1>
            <p className="text-xl mb-8">Reduce wait times, eliminate crowded waiting areas, and keep your customers happy with our digital waitlist solution.</p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/register" className="bg-blue-500 hover:bg-blue-600 text-center px-6 py-3 rounded-lg text-lg font-medium transition duration-300">Get Started Free</Link>
              <a href="#demo" className="bg-transparent border-2 border-white hover:bg-white hover:text-blue-900 text-center px-6 py-3 rounded-lg text-lg font-medium transition duration-300">Watch Demo</a>
            </div>
          </div>
          <div className="md:w-1/2">
            <img src="https://via.placeholder.com/600x400?text=Waitlist+App+Screenshot" alt="QWait App Screenshot" className="rounded-lg shadow-xl" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Restaurants Love QWait</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-blue-600 mb-4">
                <i className="fas fa-mobile-alt text-4xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">Digital Waitlist</h3>
              <p className="text-gray-600">Customers can join your waitlist remotely via their phones, reducing congestion in your waiting area.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-blue-600 mb-4">
                <i className="fas fa-comment-dots text-4xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">SMS Notifications</h3>
              <p className="text-gray-600">Automatically notify customers when their table is ready with personalized text messages.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-blue-600 mb-4">
                <i className="fas fa-chart-line text-4xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">Wait Time Analytics</h3>
              <p className="text-gray-600">Get valuable insights into your peak times and average wait durations to optimize staffing.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-blue-600 mb-4">
                <i className="fas fa-qrcode text-4xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">QR Code Integration</h3>
              <p className="text-gray-600">Display a custom QR code in your restaurant for quick and easy waitlist sign-ups.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-blue-600 mb-4">
                <i className="fas fa-users text-4xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">Customer Database</h3>
              <p className="text-gray-600">Build a database of returning customers to improve service and personalization.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-blue-600 mb-4">
                <i className="fas fa-calendar-alt text-4xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">Reservation Management</h3>
              <p className="text-gray-600">Handle both walk-ins and reservations in a single, unified platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How QWait Works</h2>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="bg-blue-100 text-blue-800 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">1</div>
              <h3 className="text-xl font-semibold mb-3">Set Up Your Account</h3>
              <p className="text-gray-600">Create your restaurant profile in minutes and customize your settings.</p>
            </div>

            <div>
              <div className="bg-blue-100 text-blue-800 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">2</div>
              <h3 className="text-xl font-semibold mb-3">Display Your QR Code</h3>
              <p className="text-gray-600">Place your unique QR code in visible areas of your restaurant.</p>
            </div>

            <div>
              <div className="bg-blue-100 text-blue-800 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">3</div>
              <h3 className="text-xl font-semibold mb-3">Customers Join Waitlist</h3>
              <p className="text-gray-600">Guests scan the QR code or staff adds walk-ins manually.</p>
            </div>

            <div>
              <div className="bg-blue-100 text-blue-800 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">4</div>
              <h3 className="text-xl font-semibold mb-3">Notify When Ready</h3>
              <p className="text-gray-600">Send SMS notifications when tables become available.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
              </div>
              <p className="text-gray-600 mb-6">"QWait has completely transformed our busy Friday and Saturday nights. Customers love getting text updates and we've seen a 30% reduction in walk-aways during peak hours."</p>
              <div className="flex items-center">
                <div className="bg-blue-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3">M</div>
                <div>
                  <h4 className="font-semibold">Michael Rodriguez</h4>
                  <p className="text-sm text-gray-500">Manager, The Rustic Spoon</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
              </div>
              <p className="text-gray-600 mb-6">"The analytics feature has been invaluable for our staffing decisions. We can now predict our busiest times with remarkable accuracy, saving us thousands in labor costs."</p>
              <div className="flex items-center">
                <div className="bg-blue-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3">S</div>
                <div>
                  <h4 className="font-semibold">Sarah Johnson</h4>
                  <p className="text-sm text-gray-500">Owner, Coastal Grill</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star-half-alt"></i>
                </div>
              </div>
              <p className="text-gray-600 mb-6">"Our customers appreciate being able to join the waitlist from their phones and go shopping nearby until their table is ready. It's a win-win for everyone!"</p>
              <div className="flex items-center">
                <div className="bg-blue-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3">J</div>
                <div>
                  <h4 className="font-semibold">James Chen</h4>
                  <p className="text-sm text-gray-500">Owner, Fusion Kitchen</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-xl font-bold mb-4">Basic</h3>
              <p className="text-gray-600 mb-6">Perfect for new restaurants</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>Up to 100 parties per month</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>SMS notifications</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>Basic analytics</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>QR code generation</span>
                </li>
              </ul>
              <Link to="/register?plan=basic" className="block text-center bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition duration-300">Get Started</Link>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-blue-500 transform md:-translate-y-4 z-10">
              <div className="bg-blue-500 text-white text-xs font-bold uppercase py-1 px-2 rounded-full inline-block mb-4">Most Popular</div>
              <h3 className="text-xl font-bold mb-4">Pro</h3>
              <p className="text-gray-600 mb-6">For growing restaurants</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$59</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>Unlimited parties</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>Advanced SMS templates</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>Detailed analytics & reporting</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>Customer database</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>Reservation management</span>
                </li>
              </ul>
              <Link to="/register?plan=pro" className="block text-center bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition duration-300">Get Started</Link>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-xl font-bold mb-4">Enterprise</h3>
              <p className="text-gray-600 mb-6">For multiple locations</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$129</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>Multiple location support</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>Priority support</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>API access</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>Custom integrations</span>
                </li>
              </ul>
              <Link to="/register?plan=enterprise" className="block text-center bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition duration-300">Get Started</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="demo" className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Restaurant's Waitlist?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Join thousands of restaurants already using QWait to improve customer satisfaction and streamline operations.</p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/register" className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-medium transition duration-300">Start Free Trial</Link>
            <a href="#contact" className="bg-transparent border-2 border-white hover:bg-white hover:text-blue-900 px-8 py-3 rounded-lg text-lg font-medium transition duration-300">Schedule Demo</a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Get In Touch</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
              <p className="text-gray-600 mb-6">Have questions? Our team is here to help. Reach out to us and we'll get back to you as soon as possible.</p>

              <div className="space-y-4">
                <div className="flex items-start">
                  <i className="fas fa-map-marker-alt text-blue-500 mt-1 mr-3"></i>
                  <div>
                    <h4 className="font-medium">Address</h4>
                    <p className="text-gray-600">123 Restaurant Row, San Francisco, CA 94110</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <i className="fas fa-phone-alt text-blue-500 mt-1 mr-3"></i>
                  <div>
                    <h4 className="font-medium">Phone</h4>
                    <p className="text-gray-600">(555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <i className="fas fa-envelope text-blue-500 mt-1 mr-3"></i>
                  <div>
                    <h4 className="font-medium">Email</h4>
                    <p className="text-gray-600">info@qwait.com</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="font-medium mb-3">Follow Us</h4>
                <div className="flex space-x-4">
                  <a href="#" className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full"><i className="fab fa-facebook-f text-blue-600"></i></a>
                  <a href="#" className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full"><i className="fab fa-twitter text-blue-400"></i></a>
                  <a href="#" className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full"><i className="fab fa-instagram text-pink-600"></i></a>
                  <a href="#" className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full"><i className="fab fa-linkedin-in text-blue-800"></i></a>
                </div>
              </div>
            </div>

            <div>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" id="name" name="name" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" id="email" name="email" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input type="text" id="subject" name="subject" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea id="message" name="message" rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>

                <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg transition duration-300">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">QWait</h3>
              <p className="text-gray-400">The smart waitlist management solution for modern restaurants.</p>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white">Features</a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a>
                </li>
                <li>
                  <a href="#contact" className="text-gray-400 hover:text-white">Contact</a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">Blog</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">Help Center</a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">Documentation</a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">API</a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">Status</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">Cookie Policy</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; {new Date().getFullYear()} QWait. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-twitter"></i></a>
              <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-instagram"></i></a>
              <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-linkedin-in"></i></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage; 