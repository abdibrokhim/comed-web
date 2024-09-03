import { Page, Text, View, Document, StyleSheet, renderToStream, Image, Font } from '@react-pdf/renderer';
import { NextResponse } from 'next/server';

const studyType = "PROTOCOL OF MRI STUDY OF THE BRAIN";
const disclaimerA = 'This conclusion is not a final diagnosis and requires comparison with clinical and laboratory data.';
const disclaimerB = `In case of typos, contact phone: `;

const sampleData = {
  patientDetails: {
    name: "John Doe",
    birthYear: "1975",
    phoneNumber: "+1234567890"
  },
  hospitalDetails: {
    name: 'SI "REPUBLICAN SPECIALIZED CENTER FOR SURGERY NAMED AFTER ACADEMICIAN V. VAKHIDOV"',
    department: "DEPARTMENT OF MAGNETIC RESONANCE AND COMPUTED TOMOGRAPHY",
    address: `Uzbekistan, Tashkent, ul. Farkhadskaya 10.`,
    phone: "+0987654321"
  },
  imageUrls: [
    "https://firebasestorage.googleapis.com/v0/b/chatwithpdf-30e42.appspot.com/o/images%2F1724335515486.jpg?alt=media&token=3b886b80-3815-4146-b548-1d3dd27e4643",
    "https://firebasestorage.googleapis.com/v0/b/chatwithpdf-30e42.appspot.com/o/images%2F1724335515486.jpg?alt=media&token=3b886b80-3815-4146-b548-1d3dd27e4643"
  ],
  conclusionText: "MRI signs of vascular encephalopathy with the presence of multiple ischemic foci and atrophy of the frontotemporal areas on both sides. Left maxillary sinus cyst. Consultation with a neurologist is recommended. Consultation with an otolaryngologist is recommended.",
  radiologistName: "Dr. Emily Smith",
  headDoctorName: "Dr. John Watson",
  createdAt: new Date(),
};

Font.register({
  family: 'Oswald',
  src: 'https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf'
});

const styles = StyleSheet.create({
  body: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
  },
  subSubTitle: {
    fontSize: 16,
    textAlign: 'left',
    fontFamily: 'Oswald'
  },
  infoHeader: {
    borderBottom: 1,
    marginBottom: 4,
    fontSize: 10,
    textAlign: 'left',
    fontFamily: 'Oswald'
  },
  author: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    margin: 10,
    fontFamily: 'Oswald'
  },
  headerTitle: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 6,
    fontFamily: 'Oswald'
  },
  headerTitleWithBorder: {
    borderBottom: 1,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 6,
    fontFamily: 'Oswald'
  },
  headerTitleCentered: {
    textAlign: 'center',
    fontSize: 10,
    marginTop: 6,
    marginBottom: 6,
    fontFamily: 'Oswald'
  },
  makeRow: {
    marginTop: 4,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  text: {
    marginTop: 2,
    marginBottom: 2,
    fontSize: 8,
    fontFamily: 'Times-Roman'
  },
  headerText: {
    fontSize: 8,
    fontFamily: 'Times-Roman'
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
  imageCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  header: {
    marginBottom: 10,
    textAlign: 'center',
    color: 'black',
  },
  footer: {
    marginBottom: 20,
    textAlign: 'center',
    color: 'grey',
  },
  footerText: {
    fontSize: 6,
    marginBottom: 4,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 12,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
  },
  section: {
    marginBottom: 10
  },
});

interface InvoiceProps {
  invoice: {
    id: number;
    name: string;
    dateCreated: number;
    value: number;
    description: string;
    status: string;
    customer: {
      name: string;
      email: string;
    }
  };
}

const Invoice = ({ invoice }: InvoiceProps) => {
  return (
    <Document>
      <Page style={styles.body}>
        <View>
          <View style={styles.header}>
            <Text style={styles.headerTitleWithBorder}>{sampleData.hospitalDetails.name.toUpperCase()}</Text>
            <Text style={styles.headerTitle}>{sampleData.hospitalDetails.department.toUpperCase()}</Text>
            <Text style={styles.headerText}>{sampleData.hospitalDetails.address + ' Phone: ' + sampleData.hospitalDetails.phone}</Text>
          </View>
          <View style={styles.makeRow}>
            <View style={styles.section}>
              <Text style={styles.infoHeader}>{'Patient Infos'.toUpperCase()}</Text>
              <Text style={styles.text}>Name: {sampleData.patientDetails.name}</Text>
              <Text style={styles.text}>Birth Year: {sampleData.patientDetails.birthYear}</Text>
              <Text style={styles.text}>Phone Number: {sampleData.patientDetails.phoneNumber}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.infoHeader}>{'Medicals Infos'.toUpperCase()}</Text>
              <Text style={styles.text}>Radiologist Name: {sampleData.radiologistName}</Text>
              <Text style={styles.text}>Doctor Name: {sampleData.headDoctorName}</Text>
              <Text style={styles.text}>Date: {sampleData.createdAt.toLocaleDateString()}</Text>
            </View>
          </View>
          <View style={styles.section}>
            <View style={styles.imageCenter}>
              <Text style={styles.headerTitleCentered}>{studyType}</Text>
              {sampleData.imageUrls.map((url, index) => (
                <Image key={index} src={url} style={styles.image} />
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.headerTitleCentered}>{'Medical Conclusion'.toUpperCase()}</Text>
            <Text style={styles.text}>{sampleData.conclusionText}</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>{disclaimerA}</Text>
          <Text style={styles.footerText}>{disclaimerB + ' ' + sampleData.hospitalDetails.phone}</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function GET(request: Request, { params }: { params: { invoiceId: string; }}) {
  const invoice = {
    id: 1,
    name: 'Sample Invoice',
    dateCreated: Date.now(),
    value: 1234,
    description: 'This is a sample invoice.',
    status: 'open',
    customer: {
      name: 'John Smith',
      email: 'john@smith.com'
    }
  };
  const stream = await renderToStream(<Invoice invoice={invoice} />);
  return new NextResponse(stream as unknown as ReadableStream)
}