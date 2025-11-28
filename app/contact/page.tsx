"use client";

import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormInput from "@/components/ui/form-input";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-24 relative overflow-hidden">
       
       <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left Column: Info */}
          <div className="space-y-8">
             <div>
                <TextGenerateEffect 
                   words="Get in touch with us"
                   className="text-4xl md:text-5xl lg:text-6xl font-light mb-6"
                   accentWords={["touch"]}
                   accentClassName="text-accent font-bold"
                />
                <p className="text-secondary text-lg mt-6 max-w-md leading-relaxed">
                   Have questions about your next journey? We're here to help you plan the perfect trip. Reach out to us anytime.
                </p>
             </div>

             <div className="space-y-8 mt-8">
                <div className="flex items-center gap-5 group">
                   <div className="p-4 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                      <Mail className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="font-medium text-lg">Email</h3>
                      <p className="text-secondary">support@restal.com</p>
                   </div>
                </div>

                <div className="flex items-center gap-5 group">
                   <div className="p-4 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                      <Phone className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="font-medium text-lg">Phone</h3>
                      <p className="text-secondary">+1 (555) 123-4567</p>
                   </div>
                </div>

                <div className="flex items-center gap-5 group">
                   <div className="p-4 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                      <MapPin className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="font-medium text-lg">Office</h3>
                      <p className="text-secondary">123 Travel St, World</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Right Column: Form */}
          <div className="bg-white/5 p-8 md:p-10 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
             <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-white/80">First name</Label>
                      <Input 
                        id="firstName" 
                        placeholder="John" 
                        className="bg-black/40 border-white/10 focus:border-accent/50 h-12" 
                      />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-white/80">Last name</Label>
                      <Input 
                        id="lastName" 
                        placeholder="Doe" 
                        className="bg-black/40 border-white/10 focus:border-accent/50 h-12" 
                      />
                   </div>
                </div>
                
                <FormInput 
                   labelText="Email" 
                   placeholder="john@example.com" 
                   formatType="email"
                   containerClassName="space-y-2"
                   className="bg-black/40 border-white/10 focus:border-accent/50 h-12"
                />

                <div className="space-y-2">
                   <Label htmlFor="message" className="text-white/80">Message</Label>
                   <textarea 
                      id="message"
                      className="flex min-h-[150px] w-full rounded-md border border-white/10 bg-black/40 px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-accent/50 resize-none"
                      placeholder="Tell us about your travel plans..."
                   />
                </div>

                <Button className="w-full bg-accent hover:bg-accent/90 text-white h-12 text-base font-medium rounded-xl mt-2">
                   Send Message
                   <Send className="w-4 h-4 ml-2" />
                </Button>
             </form>
          </div>
       </div>
    </main>
  );
}
