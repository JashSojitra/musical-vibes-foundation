import Home from '@/components/home';
import { site } from '@/data/site';
export default function Page(){
  const structuredData = {
    '@context':'https://schema.org', '@graph':[
      {'@type':'Organization', '@id':`${site.url}/#organization`, name:site.name, url:site.url, logo:`${site.url}/assets/legacy/logo.png`, description:site.mission, email:site.email, telephone:site.phone, address:{'@type':'PostalAddress', addressLocality:'Brampton', addressRegion:'ON', addressCountry:'CA'}},
      {'@type':'WebSite', '@id':`${site.url}/#website`, url:site.url, name:site.name, publisher:{'@id':`${site.url}/#organization`}},
      {'@type':'FAQPage', mainEntity:site.faq.map(item=>({'@type':'Question', name:item.question, acceptedAnswer:{'@type':'Answer', text:item.answer}}))}
    ]
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,'\\u003c')}}/><Home/></>;
}
