"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy } from "lucide-react"
import { toast } from "sonner"

const EXAMPLES = [
  {
    name: "Declaration of Independence",
    text: `The unanimous Declaration of the thirteen united States of America, When in the Course of human events, it becomes necessary for one people to dissolve the political bands which have connected them with another, and to assume among the powers of the earth, the separate and equal station to which the Laws of Nature and of Nature's God entitle them, a decent respect to the opinions of mankind requires that they should declare the causes which impel them to the separation.

We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.--That to secure these rights, Governments are instituted among Men, deriving their just powers from the consent of the governed, --That whenever any Form of Government becomes destructive of these ends, it is the Right of the People to alter or to abolish it, and to institute new Government, laying its foundation on such principles and organizing its powers in such form, as to them shall seem most likely to effect their Safety and Happiness. Prudence, indeed, will dictate that Governments long established should not be changed for light and transient causes; and accordingly all experience hath shewn, that mankind are more disposed to suffer, while evils are sufferable, than to right themselves by abolishing the forms to which they are accustomed. But when a long train of abuses and usurpations, pursuing invariably the same Object evinces a design to reduce them under absolute Despotism, it is their right, it is their duty, to throw off such Government, and to provide new Guards for their future security.--Such has been the patient sufferance of these Colonies; and such is now the necessity which constrains them to alter their former Systems of Government. The history of the present King of Great Britain is a history of repeated injuries and usurpations, all having in direct object the establishment of an absolute Tyranny over these States. To prove this, let Facts be submitted to a candid world.

He has refused his Assent to Laws, the most wholesome and necessary for the public good.

He has forbidden his Governors to pass Laws of immediate and pressing importance, unless suspended in their operation till his Assent should be obtained; and when so suspended, he has utterly neglected to attend to them.

He has refused to pass other Laws for the accommodation of large districts of people, unless those people would relinquish the right of Representation in the Legislature, a right inestimable to them and formidable to tyrants only.

He has called together legislative bodies at places unusual, uncomfortable, and distant from the depository of their public Records, for the sole purpose of fatiguing them into compliance with his measures.

He has dissolved Representative Houses repeatedly, for opposing with manly firmness his invasions on the rights of the people.

He has refused for a long time, after such dissolutions, to cause others to be elected; whereby the Legislative powers, incapable of Annihilation, have returned to the People at large for their exercise; the State remaining in the mean time exposed to all the dangers of invasion from without, and convulsions within.

He has endeavoured to prevent the population of these States; for that purpose obstructing the Laws for Naturalization of Foreigners; refusing to pass others to encourage their migrations hither, and raising the conditions of new Appropriations of Lands.

He has obstructed the Administration of Justice, by refusing his Assent to Laws for establishing Judiciary powers.

He has made Judges dependent on his Will alone, for the tenure of their offices, and the amount and payment of their salaries.

He has erected a multitude of New Offices, and sent hither swarms of Officers to harrass our people, and eat out their substance.

He has kept among us, in times of peace, Standing Armies without the Consent of our legislatures.

He has affected to render the Military independent of and superior to the Civil power.

He has combined with others to subject us to a jurisdiction foreign to our constitution, and unacknowledged by our laws; giving his Assent to their Acts of pretended Legislation:

For Quartering large bodies of armed troops among us:

For protecting them, by a mock Trial, from punishment for any Murders which they should commit on the Inhabitants of these States:

For cutting off our Trade with all parts of the world:

For imposing Taxes on us without our Consent:

For depriving us in many cases, of the benefits of Trial by Jury:

For transporting us beyond Seas to be tried for pretended offences:

For abolishing the free System of English Laws in a neighbouring Province, establishing therein an Arbitrary government, and enlarging its Boundaries so as to render it at once an example and fit instrument for introducing the same absolute rule into these Colonies:

For taking away our Charters, abolishing our most valuable Laws, and altering fundamentally the Forms of our Governments:

For suspending our own Legislatures, and declaring themselves invested with power to legislate for us in all cases whatsoever.

He has abdicated Government here, by declaring us out of his Protection and waging War against us.

He has plundered our seas, ravaged our Coasts, burnt our towns, and destroyed the lives of our people.

He is at this time transporting large Armies of foreign Mercenaries to compleat the works of death, desolation and tyranny, already begun with circumstances of Cruelty & perfidy scarcely paralleled in the most barbarous ages, and totally unworthy the Head of a civilized nation.

He has constrained our fellow Citizens taken Captive on the high Seas to bear Arms against their Country, to become the executioners of their friends and Brethren, or to fall themselves by their Hands.

He has excited domestic insurrections amongst us, and has endeavoured to bring on the inhabitants of our frontiers, the merciless Indian Savages, whose known rule of warfare, is an undistinguished destruction of all ages, sexes and conditions.

In every stage of these Oppressions We have Petitioned for Redress in the most humble terms: Our repeated Petitions have been answered only by repeated injury. A Prince, whose character is thus marked by every act which may define a Tyrant, is unfit to be the ruler of a free people.

Nor have We been wanting in attentions to our Brittish brethren. We have warned them from time to time of attempts by their legislature to extend an unwarrantable jurisdiction over us. We have reminded them of the circumstances of our emigration and settlement here. We have appealed to their native justice and magnanimity, and we have conjured them by the ties of our common kindred to disavow these usurpations, which, would inevitably interrupt our connections and correspondence. They too have been deaf to the voice of justice and of consanguinity. We must, therefore, acquiesce in the necessity, which denounces our Separation, and hold them, as we hold the rest of mankind, Enemies in War, in Peace Friends.

We, therefore, the Representatives of the united States of America, in General Congress, Assembled, appealing to the Supreme Judge of the world for the rectitude of our intentions, do, in the Name, and by Authority of the good People of these Colonies, solemnly publish and declare, That these United Colonies are, and of Right ought to be Free and Independent States; that they are Absolved from all Allegiance to the British Crown, and that all political connection between them and the State of Great Britain, is and ought to be totally dissolved; and that as Free and Independent States, they have full Power to levy War, conclude Peace, contract Alliances, establish Commerce, and to do all other Acts and Things which Independent States may of right do. And for the support of this Declaration, with a firm reliance on the protection of divine Providence, we mutually pledge to each other our Lives, our Fortunes and our sacred Honor.`,
  },
  {
    name: "Alice in Wonderland Ch 1",
    text: `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversation?"
So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.

There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.

In another moment down went Alice after it, never once considering how in the world she was to get out again.

The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.

Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and bookshelves; here and there she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labelled "ORANGE MARMALADE", but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody, so managed to put it into one of the cupboards as she fell past it.

"Well!" thought Alice to herself, "after such a fall as this, I shall think nothing of tumbling downstairs! How brave they'll all think me at home! Why, I wouldn't say anything about it, even if I fell off the top of the house!" (Which was very likely true.)

Down, down, down. Would the fall never come to an end! "I wonder how many miles I've fallen by this time?" she said aloud. "I must be getting somewhere near the centre of the earth. Let me see: that would be four thousand miles down, I think—" (for, you see, Alice had learnt several things of this sort in her lessons in the schoolroom, and though this was not a very good opportunity for showing off her knowledge, as there was no one to listen to her, still it was good practice to say it over) "—yes, that's about the right distance—but then I wonder what Latitude or Longitude I've got to?" (Alice had no idea what Latitude was, or Longitude either, but thought they were nice grand words to say.)

Presently she began again. "I wonder if I shall fall right through the earth! How funny it'll seem to come out among the people that walk with their heads downward! The Antipathies, I think—" (she was rather glad there was no one listening, this time, as it didn't sound at all the right word) "—but I shall have to ask them what the name of the country is, you know. Please, Ma'am, is this New Zealand or Australia?" (and she tried to curtsey as she spoke—fancy curtseying as you're falling through the air! Do you think you could manage it?) "And what an ignorant little girl she'll think me for asking! No, it'll never do to ask: perhaps I shall see it written up somewhere."

Down, down, down. There was nothing else to do, so Alice soon began talking again. "Dinah'll miss me very much to-night, I should think!" (Dinah was the cat.) "I hope they'll remember her saucer of milk at tea-time. Dinah my dear! I wish you were down here with me! There are no mice in the air, I'm afraid, but you might catch a bat, and that's very like a mouse, you know. But do cats eat bats, I wonder?" And here Alice began to get rather sleepy, and went on saying to herself, in a dreamy sort of way, "Do cats eat bats? Do cats eat bats?" and sometimes, "Do bats eat cats?" for, you see, as she couldn't answer either question, it didn't much matter which way she put it. She felt that she was dozing off, and had just begun to dream that she was walking hand in hand with Dinah, and saying to her very earnestly, "Now, Dinah, tell me the truth: did you ever eat a bat?" when suddenly, thump! thump! down she came upon a heap of sticks and dry leaves, and the fall was over.`,
  },
]

export function ArithmeticCoder() {
  const [compressInput, setCompressInput] = useState("")
  const [compressOutput, setCompressOutput] = useState("")
  const [compressProgress, setCompressProgress] = useState<number | null>(null)
  const [decompressInput, setDecompressInput] = useState("")
  const [decompressOutput, setDecompressOutput] = useState("")
  const [decompressProgress, setDecompressProgress] = useState<number | null>(null)

  const compressOutputRef = useRef<HTMLPreElement>(null)
  const decompressOutputRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (compressOutputRef.current) {
      compressOutputRef.current.scrollTop = compressOutputRef.current.scrollHeight
    }
  }, [compressOutput])

  useEffect(() => {
    if (decompressOutputRef.current) {
      decompressOutputRef.current.scrollTop = decompressOutputRef.current.scrollHeight
    }
  }, [decompressOutput])

  const handleCompress = async () => {
    setCompressOutput("")
    setCompressProgress(0)

    try {
      const res = await fetch("http://localhost:8000/compress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(compressInput),
      })

      const reader = res.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter((line) => line.startsWith("data: "))

        for (const line of lines) {
          const data = JSON.parse(line.slice(6))
          setCompressProgress(data.progress)
          if (data.result) {
            setCompressOutput(data.result)
            setCompressProgress(null)
          }
        }
      }
    } catch (error) {
      toast.error("Failed to compress. Make sure the backend is running on localhost:8000")
      setCompressProgress(null)
    }
  }

  const handleDecompress = async () => {
    setDecompressOutput("")
    setDecompressProgress(0)

    try {
      const res = await fetch("http://localhost:8000/decompress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(decompressInput),
      })

      const reader = res.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter((line) => line.startsWith("data: "))

        for (const line of lines) {
          const data = JSON.parse(line.slice(6))
          setDecompressProgress(data.progress)
          if (data.chunk) {
            setDecompressOutput((prev) => prev + data.chunk)
          }
          if (data.result !== undefined) {
            setDecompressOutput(data.result)
            setDecompressProgress(null)
          }
        }
      }
    } catch (error) {
      toast.error("Failed to decompress, Make sure the backend is running on localhost:8000")
      setDecompressProgress(null)
    }
  }

  const handleClear = (type: "compress" | "decompress") => {
    if (type === "compress") {
      setCompressInput("")
      setCompressOutput("")
    } else {
      setDecompressInput("")
      setDecompressOutput("")
    }
  }

  const copyToClipboard = (text: string, name: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${name} copied to clipboard`)
  }

  return (
    // <div className="min-h-screen space-y-16 px-4 py-8 sm:px-6 lg:px-8">
    <div className="space-y-16 px-45 py-25 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mx-auto space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-foreground md:text-5xl" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 250 }}>LLM Arithmetic Coder</h1>
          <p className="text-sm text-muted-foreground mt-1.5" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>
            by Liam Wilbur · CS109 Challenge
          </p>
        </div>

        <div className="mx-auto max-w-3xl space-y-6">
          <p className="text-lg leading-relaxed text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>
            Efficient text compression with arithmetic coding using LLMs to produce the underlying probabilistic distributions. Compress and
            decompress text using natural language prediction.
          </p>

          {/* Example Texts */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>Try encoding these examples!</p>
            <div className="flex flex-col items-center gap-3">
              {EXAMPLES.map((example) => (
                <div
                  key={example.name}
                  className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-2 transition-colors hover:bg-muted w-full max-w-xs"
                >
                  <span className="text-sm text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>{example.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(example.text, example.name)}
                    className="gap-2 cursor-pointer"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compress/Decompress Interface */}
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 md:grid-cols-2">
        {/* Compress Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-light text-foreground text-center" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 200 }}>Compress</h2>
          <Textarea
            placeholder="Text to compress..."
            value={compressInput}
            onChange={(e) => setCompressInput(e.target.value)}
            className="min-h-[240px] resize-none rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
          <div className="flex gap-3">
            <Button
              onClick={handleCompress}
              disabled={compressProgress !== null}
              className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              {compressProgress !== null ? "Compressing..." : "Compress"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleClear("compress")}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              Clear
            </Button>
          </div>

          {compressProgress !== null && (
            <div className="relative h-6 overflow-hidden rounded-lg bg-muted">
              <div
                className="h-full bg-primary transition-all duration-100 ease-out"
                style={{ width: `${compressProgress * 100}%` }}
              />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                {Math.round(compressProgress * 100)}%
              </span>
            </div>
          )}

          {compressOutput && (
            <pre
              ref={compressOutputRef}
              className="max-h-[300px] overflow-y-auto whitespace-pre-wrap break-all rounded-lg bg-muted/50 p-3 text-sm text-foreground font-sans"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}
            >
              {compressOutput}
            </pre>
          )}
        </div>

        {/* Decompress Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-light text-foreground text-center" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 200 }}>Decompress</h2>
          <Textarea
            placeholder="Text to decompress..."
            value={decompressInput}
            onChange={(e) => setDecompressInput(e.target.value)}
            className="min-h-[240px] resize-none rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
          <div className="flex gap-3">
            <Button
              onClick={handleDecompress}
              disabled={decompressProgress !== null}
              className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              {decompressProgress !== null ? "Decompressing..." : "Decompress"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleClear("decompress")}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              Clear
            </Button>
          </div>

          {decompressProgress !== null && (
            <div className="relative h-6 overflow-hidden rounded-lg bg-muted">
              <div
                className="h-full bg-primary transition-all duration-100 ease-out"
                style={{ width: `${decompressProgress * 100}%` }}
              />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                {Math.round(decompressProgress * 100)}%
              </span>
            </div>
          )}

          {decompressOutput && (
            <pre
              ref={decompressOutputRef}
              className="max-h-[300px] overflow-y-auto whitespace-pre-wrap break-all rounded-lg bg-muted/50 p-3 text-sm text-foreground font-sans"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}
            >
              {decompressOutput}
            </pre>
          )}
        </div>
      </div>
      </div>

      {/* Footer Section */}
      <div className="mx-auto max-w-3xl space-y-4 border-t border-border pt-12 text-center">
        <h3 className="text-xl font-light text-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>How It Works</h3>
        <p className="leading-relaxed text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>
          Arithmetic coding is a form of entropy coding that represents an input message as a single number between 0 and 1 (represented in base64 here).
          Each step in the encoding process depends upon a PMF generated by an LLM. Interested in how arithmetic coding works and why LLMs work so well
          in compression? Check out my <a href="LLM_Arithmetic_Coding.pdf" download style={{ color: '#4F46E5', textDecoration: 'underline', cursor: 'pointer' }}>write-up</a>.  <br />
          This version of arithmetic coding is significantly more effective at compressing, meaning it produces an encoded output in less bytes,
          than compressors such as gzip, bzip2, and xz.
          <br></br>
          <br></br>
        </p>

        {/* Comparison tables */}
        <div className="mt-8 flex flex-col gap-6 md:flex-row md:justify-center">
          {/* Declaration of Independence table */}
          <div className="w-full max-w-xs rounded-lg border border-white/40 p-4 text-left">
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Declaration of Independence
            </h4>
            <table className="w-full text-sm text-foreground">
              <thead>
                <tr className="border-b border-white/30">
                  <th className="py-2 text-left">Method</th>
                  <th className="py-2 text-right">Bytes</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/20">
                  <td className="py-1">LLM Arithmetic Coder</td>
                  <td className="py-1 text-right">36</td>
                </tr>
                <tr className="border-b border-white/20">
                  <td className="py-1">gzip</td>
                  <td className="py-1 text-right">3536</td>
                </tr>
                <tr className="border-b border-white/20">
                  <td className="py-1">bzip2</td>
                  <td className="py-1 text-right">3235</td>
                </tr>
                <tr>
                  <td className="py-1">xz</td>
                  <td className="py-1 text-right">3548</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Alice in Wonderland table */}
          <div className="w-full max-w-xs rounded-lg border border-white/40 p-4 text-left">
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Alice in Wonderland
            </h4>
            <table className="w-full text-sm text-foreground">
              <thead>
                <tr className="border-b border-white/30">
                  <th className="py-2 text-left">Method</th>
                  <th className="py-2 text-right">Bytes</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/20">
                  <td className="py-1">LLM Arithmetic Coder</td>
                  <td className="py-1 text-right">232</td>
                </tr>
                <tr className="border-b border-white/20">
                  <td className="py-1">gzip</td>
                  <td className="py-1 text-right">2299</td>
                </tr>
                <tr className="border-b border-white/20">
                  <td className="py-1">bzip2</td>
                  <td className="py-1 text-right">2184</td>
                </tr>
                <tr>
                  <td className="py-1">xz</td>
                  <td className="py-1 text-right">2348</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p className="leading-relaxed text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: 13 }}>
        </p>
      </div>
    </div>
  )
}

export default ArithmeticCoder

