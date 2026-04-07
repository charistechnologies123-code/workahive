export default function SupportPage() {
  const whatsappNumber = "+2349130276015"; // replace with your admin number
  const message = encodeURIComponent(
    "Hello WorkaHive Support, I need assistance with..."
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16 flex items-center justify-center">
      <div className="bg-white max-w-xl w-full p-8 rounded-2xl shadow-md text-center space-y-6">
        
        <h1 className="text-3xl font-bold">
          Contact Support
        </h1>

        <p className="text-gray-600">
          Need help with WorkaHive? Reach out to us directly and we’ll respond as soon as possible.
        </p>

        {/* WhatsApp Button */}
        <a
          href={`https://wa.me/${whatsappNumber}?text=${message}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-semibold"
        >
          Chat with us on WhatsApp
        </a>

        {/* Email */}
        <div className="text-gray-700">
          <p className="mb-1">Or send us an email:</p>
          <a
            href="mailto:support@workahive.com"
            className="text-purple-600 font-medium hover:underline"
          >
            support@workahive.com
          </a>
        </div>
      </div>
    </div>
  );
}