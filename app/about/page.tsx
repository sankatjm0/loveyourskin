export default function AboutPage() {
  return (
    <div className="bg-background">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">About Us</h1>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p className="text-lg">
            We are dedicated to providing premium, carefully curated products that combine exceptional design with
            functional excellence.
          </p>
          <p>
            Our mission is to help you create beautiful, organized spaces that reflect your personal style. Every
            product in our collection is handpicked for quality and aesthetics.
          </p>
          <p>
            With over 10 years of experience in retail, we understand what makes a product truly special - it's not just
            about the item itself, but the care and attention that goes into selecting and delivering it.
          </p>
          <h2 className="text-2xl font-bold mt-12 text-foreground">Our Values</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></span>
              <span>Quality - We never compromise on the quality of our products</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></span>
              <span>Sustainability - Eco-friendly practices in everything we do</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></span>
              <span>Customer Service - Your satisfaction is our priority</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
